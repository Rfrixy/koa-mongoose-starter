const _ = require('lodash');
const { ObjectID } = require('mongodb');
const { logger, MiscUtils } = require('.');

function getQueryOptions(limit, skip, sortBy, sortOrder) {
  const options = { limit: parseInt(limit, 10), skip: parseInt(skip, 10) };
  let order = -1;
  if (!sortOrder) order = -1;
  if (sortOrder && sortOrder === 'asc') order = 1;
  if (sortBy) options.sort = { [sortBy]: order };
  else options.sort = { createdAt: order };
  return options;
}


/**
 * @typedef {{
 *  limit: number,
 *  skip: number,
 *  fromDate: string | Date,
 *  toDate: string | Date,
 * }} PaginationData
 */

/**
 *
 * @param {any} data
 * @param {boolean} [forceDates]
 */
function initializePaginationData(data, forceDates = true) {
  const _data = { ...data };
  _data.skip = ((data.skip && !isNaN(data.skip)) && parseInt(data.skip, 10)) || 0;
  _data.limit = ((data.limit && !isNaN(data.limit)) && parseInt(data.limit, 10)) || 100;
  if (!data.exported && _data.limit > 500) _data.limit = 500;
  if (forceDates || data.fromDate) {
    _data.fromDate = data.fromDate || new Date();
    _data.fromDate = MiscUtils.dateToMidnight(_data.fromDate);
  }
  if (forceDates || data.toDate) {
    _data.toDate = data.toDate || +new Date();
    _data.toDate = MiscUtils.dateToMidnight(MiscUtils.addMinutesToDate(_data.toDate, 24 * 60));
  }
  return _data;
}


function getMatchingPaths(query, Model) {
  const paths = [];
  const _query = { ...query };
  delete _query.fromDate;
  delete _query.toDate;
  for (const key of Object.keys(query)) {
    if (key in Model.schema.paths) {
      paths.push(key);
    }
  }
  return paths;
}


function getMatchQueryForListing(paths, query) {
  function getSubMatchQuery(path, array, convertToObjectId = false) {
    if (convertToObjectId) {
      try {
        array = array.map((x) => ObjectID(x));
      } catch (err) {
        // if not actually an object id
      }
    }
    if (array.length > 0) return { [path]: { $in: array } };
    return { [path]: array[0] };
  }
  let _query = {};
  if (paths && paths.length) {
    for (const path of paths) {
      query[path] = _.castArray(query[path]); //eslint-disable-line
      const firstItem = query[path][0];
      let convertToObjectId = false;
      try {
        if (firstItem.match(MiscUtils.ObjectIdRegex)) convertToObjectId = true;
      } catch (err) { convertToObjectId = false; }
      _query = { ..._query, ...getSubMatchQuery(path, query[path], convertToObjectId) };
    }
  }
  return _query;
}

// use fromDate & toDate to send time range queries
async function paginatedList({
  Model,
  filters,
  requiredFields,
  limit,
  skip,
  sortBy,
  sortOrder,
  timeKey,
  fromDate,
  toDate,
  customMatch,
  options,
}) {
  if (!limit) limit = 500;
  let query;
  try {
    if (filters) query = _.isPlainObject(filters) ? filters : JSON.parse(filters);
    query = _.omitBy(query, (v) => (_.isNumber(v) ? Number.isNaN(v) : _.isEmpty(v)));
  } catch (err) {
    return { status: 2, message: 'Query failed, invalid JSON in filters', statusCode: 400 };
  }
  const matchingPaths = getMatchingPaths(query, Model);
  query = getMatchQueryForListing(matchingPaths, query, timeKey);
  if (timeKey) {
    if (fromDate) { query[timeKey] = { ...query[timeKey], $gte: new Date(fromDate) }; }
    if (toDate) { query[timeKey] = { ...query[timeKey], $lte: new Date(toDate) }; }
  }
  query = { $and: [query, customMatch] };
  query = MiscUtils.changeTimezone(query, '+05:30', true);
  let result = {};
  const projection = {};
  for (const field of requiredFields) projection[field] = 1;
  try {
    // limit and id can be used to paginate
    const queryOptions = { ...getQueryOptions(limit, skip, sortBy, sortOrder), ...options };
    result.items = await Model.find(query, projection, queryOptions);
    const count = await Model.countDocuments(query);
    result.status = 1;
    result.total = count;
    result.limit = limit;
    result.skip = skip;
  } catch (err) {
    logger.debug(err, 'err');
    result = { message: 'Query failed', statusCode: 400 };
  }
  return result;
}


function getListingFunction(modelName, allowedFields, timeKey = 'createdAt', customMatch = {}, options = {}) {
  /**
   * @param {any} data
   * @param {import('../coreRouter').operatorOps} param1
   */
  const f = async (data, { db }) => {
    let requiredFields;
    data.fields = _.castArray(data.fields);
    if (data.fields && data.fields.length > 0) {
      requiredFields = _.intersection(allowedFields, data.fields);
    }
    if (!requiredFields || requiredFields.length === 0) requiredFields = allowedFields;
    const Model = db.models[modelName];
    data = initializePaginationData(data, false);
    const result = await paginatedList({
      Model, ...data, requiredFields, timeKey, customMatch, options,
    });
    return result;
  };
  return f;
}


// matches ids based on idquery OR phrase match
function phraseSearch(phrase, idQuery, key) {
  let match = {};
  if (phrase) {
    const re = new RegExp(`^${_.escapeRegExp(phrase)}`);
    if (idQuery) {
      const isObjectId = MiscUtils.ObjectIdRegex.test(phrase);
      match = {
        $or: [
          { [key]: { $regex: re, $options: 'i' } },
          isObjectId ? { _id: ObjectID(phrase) } : { $where: `${re}.test(this._id)` },
        ],
      };
    } else {
      match = { [key]: { $regex: re, $options: 'i' } };
    }
  }
  return match;
}

function idMatch(ids) {
  if (_.isString(ids)) {
    ids = ids.split(',');
  }
  return { _id: { $in: ids } };
}

/**
 * @param {string} modelName
 * @param {boolean} [idQuery]
 * @param {object} [customMatch]
 * @param {string} key
 */
function getSearchFunction(modelName, idQuery = false, customMatch = {}, key = 'name') {
  /**
   * @param {{
   *  phrase?: string,
   *  ids?: string | string[],
   *  filters?: object | string,
   * }} data
   * @param {import('../coreRouter').operatorOps} param1
   */
  const f = async (data, { db }) => {
    const Model = db.models[modelName];
    const { phrase, ids, filters } = data;
    if (filters) {
      const parsedFilters = _.isPlainObject(filters) ? filters : JSON.parse(filters);
      customMatch = { ...customMatch, ...parsedFilters };
    }
    let match;
    if (ids) match = idMatch(ids);
    else match = phraseSearch(phrase, idQuery, key);
    const objects = await Model.find({ $and: [match, customMatch] }, { [key]: 1 }).limit(20);
    const result = objects.map((obj) => ({ label: `${obj[key]} (${obj._id})`, value: obj._id }));
    return { status: 1, result };
  };
  return f;
}


function getDetailFunction(modelName, requiredFields, options = {}) {
  /**
   * @param {any} data
   * @param {import('../coreRouter').operatorOps} param1
   */
  const f = async (data, { db }) => {
    const Model = db.models[modelName];
    const { id } = data;
    const projection = {};
    let result;
    if (requiredFields && requiredFields.length > 0) {
      _.forEach(requiredFields, (field) => {
        projection[field] = 1;
      });
    }
    try {
      result = await Model.findOne({ _id: id }, projection, options);
    } catch (e) {} // in-case id casting throws an error

    if (result) return { status: 1, [modelName.toLowerCase()]: result };
    return { status: 2, message: `No such ${modelName}`, statusCode: 404 };
  };
  return f;
}


/**
 * Whenever we have id fields in an array of objects and we need the name field,
 *  we will use this function
 * @param {array of objects} Arr
 * @param {string} nameFieldModel name field in model (value to retrieve)
 * @param {string} nameFieldObj name field in obj (where retrieved value will be put)
 * @param {string} idInObjField the id field in the arr obj
 * @param {string} idInModelField the id field in the Model
 */
async function getNamesFromIds(Arr, Model, nameFieldModel, nameFieldObj = 'name', idInObj = '_id', idInModel = '_id') {
  let ids = [];
  for (const Obj of Arr) {
    const id = Obj[idInObj];
    if (id !== '-') ids.push(id);
  }
  ids = _.uniq(ids);
  const idToNameMap = {};
  const items = await Model.find({ [idInModel]: { $in: ids } });
  for (const item of items) {
    idToNameMap[item[idInModel]] = item[nameFieldModel];
  }
  const result = [];
  for (let obj of [...Arr]) {
    if (obj.toObject) obj = obj.toObject(); // because it might be a mongoose object with metadata
    obj[nameFieldObj] = idToNameMap[obj[idInObj]];
    result.push(obj);
  }
  return result;
}


module.exports = {
  paginatedList,
  getListingFunction,
  getDetailFunction,
  getSearchFunction,
  getNamesFromIds,
  initializePaginationData,
};
