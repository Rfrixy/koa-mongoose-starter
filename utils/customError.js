class CustomError extends Error {
  /**
   * @param {string | object} err
   * @param {number} [statusCode] http status code
   */
  constructor(err, statusCode = 500) {
    let errString;
    if (typeof err !== 'string') {
      errString = JSON.stringify(err);
    } else errString = err;
    super(errString);

    this.error = err;
    this.statusCode = statusCode;
  }
}

module.exports = CustomError;
