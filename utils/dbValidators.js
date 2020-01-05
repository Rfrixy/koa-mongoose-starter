const validate = require('mongoose-validator');

const isUrl = validate({
  validator: 'isURL',
  message: 'Is not a valid url',
  passIfEmpty: true,
});

const isEmail = validate({
  validator: 'isEmail',
  message: 'Is not a valid email',
  passIfEmpty: true,
});

const isIP = validate({
  validator: 'isIP',
  message: 'Is not a valid IP address',
  passIfEmpty: true,
});

const isAlphanumeric = validate({
  validator: 'isAlphanumeric',
  message: 'Should only include alphabets and numbers',
  passIfEmpty: true,
});


module.exports = {
  isUrl,
  isEmail,
  isIP,
  isAlphanumeric,
};
