const _ = require('lodash');
const { Error } = require('mongoose');
const { CustomError, logger } = require('../utils');


/**
 // removes duplicate paths from errors
 * example :
  "errors": {
    "clickParams[subparam1][values][3]": "# is not allowed",
    "clickParams[subparam1]": "Validation failed: values.3: # is not allowed",
    "clickParams": "Validation failed: subparam1.values.3: # is not allowed, subparam1: Validation failed: values.3: # is not allowed"
  }
  should become ---
    "errors": {
    "clickParams": "Validation failed: subparam1.values.3: # is not allowed, subparam1: Validation failed: values.3: # is not allowed"
  }
 */
function removeDuplicates(errors) {
  const _errors = { ...errors };
  const paths = _.orderBy(_.keys(errors), (error) => error);
  const deletePaths = [];
  for (let i = 0; i < paths.length - 1; i += 1) {
    if (_.includes(paths[i + 1], paths[i])) { deletePaths.push(paths[i]); }
  }
  for (const path of deletePaths) delete _errors[path];
  return _errors;
}


/**
 // removes last index from errors (for the sake of front end)
 * example :
  "errors": {
    "clickParams[subparam1][values][3]": "# is not allowed",
  }
  should become ---
  "errors": {
    "clickParams[subparam1][values]": "# is not allowed",
  }
 */
function removeLastIndex(errors) {
  const _errors = {};
  for (const key of _.keys(errors)) {
    const re = new RegExp(/\[[0-9]+\]$/);
    _errors[key.replace(re, '')] = errors[key];
  }
  return _errors;
}

function parser(err) {
  if (!err || !err.message) {
    logger.error({ err: new Error('parseError called without any error or an error without a message') });
    return {
      status: 2,
      errorCode: 500,
      error: 'Unknown Error',
    };
  }
  const response = { status: 2, errorCode: 500 };
  if (err instanceof Error.ValidationError) {
    let errors = {};
    for (const field in err.errors) {
      let path = field;
      path = path.replace(/\.(.+?)(?=\.|$)/g, (m, s) => `[${s}]`); // converts dot notation to square brackets, e.g. a.b becomes a[b]
      const { value } = err.errors[field];
      // const reason = err.errors[field].reason;
      const { message } = err.errors[field];
      if (message) errors[path] = message;
      else {
        switch (err.errors[field].kind) {
          case 'required':
            errors[path] = `${path} is required`;
            break;
          case 'enum':
            errors[path] = `${value} is invalid`;
            break;
          case 'regexp':
            errors[path] = `${value} is invalid`;
            break;
          case 'invalid':
            errors[path] = `${value} is invalid`;
            break;
          case 'unique':
            errors[path] = `${value} already exists`;
            break;
          default:
            errors[path] = `invalid ${path}`;
        }
      }
    }
    errors = removeDuplicates(errors);
    errors = removeLastIndex(errors);
    response.errors = errors;
    response.errorCode = 400;
  } else if (err instanceof Error.CastError) {
    // https://github.com/Automattic/mongoose/issues/5354#issuecomment-321998181
    response.error = `${err.stringValue} is not a valid ${err.kind} for "${err.path}"`;
    response.errorCode = 400;
  } else if (err instanceof CustomError) {
    response.errorCode = err.statusCode;
    if (_.isPlainObject(err.error)) {
      response.errors = err.error;
    } else {
      response.error = err.message;
    }
  } else {
    // ctx.throw errors
    if (err.status) {
      response.errorCode = err.status;
    }
    response.error = err.message;
  }
  return response;
}


module.exports = {
  parser,
};
