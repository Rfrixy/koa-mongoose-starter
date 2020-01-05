const { genSaltSync, hashSync } = require('bcryptjs');
const cfg = require('@smpx/cfg');
const readline = require('readline');
const crypto = require('crypto');
const _ = require('lodash');


function addMinutesToDate(date, minutes) {
  return new Date(new Date(date).getTime() + (60000 * minutes));
}

function dateToMidnight(givenDate) {
  let date = new Date();
  if (givenDate) date = new Date(givenDate);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function getStringDate(date = new Date()) {
  return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
}

function stringArraytoNumericArray(Arr) {
  return _.compact(_.map(Arr, (x) => parseInt(x, 10)));
}


function convertToObject(IdArray, fieldName) {
  const obj = {};
  for(const i in IdArray) { //eslint-disable-line
    obj[IdArray[i][fieldName]] = IdArray[i];
  }
  return obj;
}


function checkValidPercent(percent) {
  return !Number.isNaN(percent) && percent >= 0 && percent <= 100;
}


function validatePercentMap(percentMap) {
  for (const value of percentMap.values()) {
    const validPercent = checkValidPercent(value);
    if (!validPercent) throw new Error('Invalid percent supplied in throttlemap');
  }
}

/**
 * Accepts a string and returns a string with only the apha numeric charcters in it
 * @param {string} s
 */
function getAlphaNumCharsOnly(s) {
  const re = new RegExp(/[a-zA-Z0-9]/, 'g');
  const matches = s.match(re);
  if (matches && matches.length > 0) return matches.join('');
  return '';
}

/**
 * Objects with possibly uninitialized key paths can use this function.
 * o = { 'a': 4 };
 * o = updateIntegerKey(o, 'a', 3);
 * o = updateIntegerKey(o, 'b.c.d', 3);
 * o === { 'a': 7, b:{c:{d:{3}}}}
 */
function updateIntegerKey(obj, key, value, overWrite = false) {
  const keys = key.split('.');
  let subObj = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (!subObj.hasOwnProperty(keys[i])) subObj[keys[i]] = {}; //eslint-disable-line
    subObj = subObj[keys[i]];
  }
  const finalKey = keys[keys.length - 1];
  if (!subObj.hasOwnProperty(finalKey) || overWrite) subObj[finalKey] = 0; //eslint-disable-line
  subObj[finalKey] += value;
  return obj;
}

const randomShortToken = async () => {
  const token = await crypto.randomBytes(4).toString('hex') + +new Date();
  return token;
};


function isIterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}


function nullIfEmpty(itr) {
  if (!itr) return null;
  if (itr.length === 0) return null;
  return itr;
}

/**
 * @param {Original object} object
 * @param map { oldkey: newkey }
 * object = {'1': 'hello' }
 * map = { '1': '3'}
 * will return { '3': 'hello' }
 */
function convertObjectViaMap(object, map) {
  const _object = {};
  _.each(object, (value, key) => {
    const _key = map[key] || key;
    _object[_key] = value;
  });
  return _object;
}


// higher the offset, older the hour
// offset should be integer only
function getLastUTCHour(offset = 0) {
  // eslint-disable-next-line no-param-reassign
  // if (offset < 0) offset *= -1; // negative can get you current or future hours; -1 will get current hour
  const now = new Date(+new Date() - 3600 * 1000 * offset);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const h = now.getUTCHours();
  return new Date(+new Date(Date.UTC(y, m, d, h)));
}

function arrayOfObjToObj(array, keyField) {
  const result = {};
  for (const i of array) {
    result[i[keyField]] = i;
  }
  return result;
}

async function sleep(time) {
  const promise = new Promise((res) => {
    setTimeout(() => {
      res();
    }, time);
  });
  return promise;
}

function getAllTimeZones() {
  const timeZones = [];
  for (let hrs = -16; hrs <= 14; hrs += 1) {
    let sign = '+';
    let hrNum = hrs;
    if (hrs < 0) {
      sign = '-';
      hrNum *= -1;
    }
    let hours = hrNum.toString();
    if (hours.length === 1) hours = `0${hours}`;
    if (hrs > 0) {
      timeZones.push(`${sign}${hours}:00`);
      timeZones.push(`${sign}${hours}:30`);
    } else if (hrs < 0) {
      timeZones.push(`${sign}${hours}:30`);
      timeZones.push(`${sign}${hours}:00`);
    } else {
      timeZones.push(`-${hours}:30`);
      timeZones.push(`${sign}${hours}:00`);
      timeZones.push(`${sign}${hours}:30`);
    }
  }
  return timeZones;
}

/**
 * @param {array of arrays} arrays
 * when given multiple arryas such that all elements of one array might
 * also be present in another array, it is removed from the resulting array.
 * e.g.
 * deDupeSubArrays([
  [0, 1],
  [1, 2],
  [2, 3],
  [1, 2, 3, 4],
  [3, 4, 5],
  [2, 4],
  [1, 3],
  [3, 4, 5],
  [3, 4, 5, 6],
  [3, 4, 5, 6],
 * ])
 *
 * will return [ [ 0, 1 ], [ 1, 2, 3, 4 ], [ 3, 4, 5, 6 ] ]
 */
function deDupeSubarrays(arrays) {
  let res = [];
  for (const arr of arrays) {
    const newRes = [];
    let shouldAddArr = true;
    for (const r of res) {
      // arr doesn't encompass existing entry
      if (_.difference(r, arr).length !== 0) {
        newRes.push(r);
      }
      // arr adds no new entries
      if (_.difference(arr, r).length === 0) {
        shouldAddArr = false;
        break;
      }
    }
    if (shouldAddArr) {
      newRes.push(arr);
      res = newRes;
    }
  }
  return res;
}

function isValidDate(d) {
  if (!d || !(d instanceof Date) || isNaN(d)) {
    return false;
  }
  return true;
}

function UTCDate(d = new Date()) {
  const dUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
  return new Date(dUTC);
}

// reverse incase we want to match timezone date in the database
// for example indian day today will be prev day 18:30 till today 18:30
// so we subtract time in that case
function changeTimezone(data, tz = '+05:30', reverse = false) {
  let tzmins = 0;
  try {
    if (_.isString(tz)) { // tz is timezone
      tzmins = parseInt(tz.slice(1, 3), 10) * 60;
      tzmins += parseInt(tz.slice(4, 6), 10);
      if (tz[0] === '-') tzmins *= -1;
    } else if (_.isInteger(tz)) {
      tzmins = tz;
    }
  } catch (e) {
    return data;
  }

  // recursive helper
  function replaceDate(obj) {
    if (obj) {
      let _obj = obj;
      if (!_.isEmpty(obj.toObject && obj.toObject())) _obj = obj.toObject();
      if (!_.isEmpty(obj.$$populatedVirtuals)) Object.assign(_obj, obj.$$populatedVirtuals);
      obj = _obj;
    }
    if (_.isDate(obj)) {
      if (reverse) obj = addMinutesToDate(obj, -tzmins);
      else obj = addMinutesToDate(obj, tzmins);
    } else if (_.isPlainObject(obj) || _.isArray(obj)) {
      for (const key of _.keys(obj)) {
        obj[key] = replaceDate(obj[key]);
      }
    }
    return obj;
  }

  let _data = _.clone(data);
  _data = replaceDate(_data);
  return _data;
}

/**
 * Displays a question and gets true/false answer
 * @param {string} question the question to display on the cli
 */
async function getBoolAnswerCLI(ques = 'Do you want to proceed?') {
  if (cfg.isCI()) return true;
  const readLine = () => new Promise((res) => {
    const cl = readline.createInterface(process.stdin, process.stdout);
    cl.question(ques, (answer) => {
      cl.close();
      res(answer);
    });
  });
  const answer = await readLine();
  if (_.includes(['yes', 'YES', 'y', 'Y', 'haan', 'yes please'], answer)) return true;
  return false;
}

/**
 * Salts the given text
 * @param {string} text
 */
function saltTextSync(text) {
  const salt = genSaltSync(10);
  return hashSync(text, salt);
}

module.exports = {
  convertToObject,
  checkValidPercent,
  validatePercentMap,
  updateIntegerKey,
  nullIfEmpty,
  randomShortToken,
  stringArraytoNumericArray,
  deDupeSubarrays,
  isIterable,
  addMinutesToDate,
  dateToMidnight,
  getAlphaNumCharsOnly,
  ObjectIdRegex: /^[0-9a-fA-F]{24}$/,
  UrlRegex: /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/,
  convertObjectViaMap,
  getLastUTCHour,
  arrayOfObjToObj,
  sleep,
  getAllTimeZones,
  getStringDate,
  isValidDate,
  UTCDate,
  changeTimezone,
  getBoolAnswerCLI,
  saltTextSync,
};
