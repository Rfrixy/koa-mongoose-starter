const _ = require('lodash');

// only trims strings
function safeTrim(value) {
  if (_.isString(value)) return _.trim(value);
  return value;
}


function trimObjectItems(obj) {
  const trimmedObj = _.mapValues(obj, (value) => {
    if (_.isArray(value)) value = _.map(value, safeTrim);
    else if (_.isPlainObject(value)) value = trimObjectItems(value);
    else value = safeTrim(value);
    return value;
  });
  return _.mapKeys(trimmedObj, (v, k) => safeTrim(k));
}


/**
 * removes all leading and trailing whitespace
 *    from every key of the req object
 */
exports.trimReqParams = (ctx, next) => {
  if (ctx.request.body) {
    ctx.request.body = trimObjectItems(ctx.request.body);
  }
  if (ctx.query) {
    ctx.query = trimObjectItems(ctx.query);
  }
  if (ctx.params) {
    ctx.params = trimObjectItems(ctx.params);
  }
  return next();
};

/**
 * removes square brackets at the end of array query parameters
 */
exports.removeSquareBrackets = (ctx, next) => {
  if (ctx.query) {
    ctx.query = _.mapKeys(ctx.query, (v, k) => k.replace(/\[\]$/, ''));
  }
  return next();
};


/**
 * Will add corresponding statuscode if found in ctx.state.resp.errorCode
 */
exports.statuscodeParserMiddleware = (ctx, next) => {
  if (ctx.state.resp) {
    const { resp } = ctx.state;
    const statusCode = resp.errorCode || 200;
    delete resp.errorCode;
    ctx.status = statusCode;
  }
  return next();
};


exports.sendCookieMiddleware = (ctx, next) => {
  const { cookies } = ctx.state;
  if (cookies) {
    for (const key of _.keys(cookies)) {
      ctx.cookie(key, cookies[key], { expires: new Date(Date.now() + 900000) });
    }
    delete ctx.state.cookies;
  }
  return next();
};


/**
 * Will send response if it finds anything in resp
 */
exports.sendResponseMiddleware = (ctx, next) => {
  if (ctx.state.resp) {
    ctx.body = ctx.state.resp;
    return null;
  }
  return next();
};

exports.invalidUrlMiddleware = (ctx) => {
  ctx.throw(404, 'Invalid API url or method');
};
