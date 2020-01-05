const {
  isUrl, isEmail,
} = require('./dbValidators');


const stringFunction = (maxlen = 500, minlen = 0) => ({
  type: String,
  minlength: minlen,
  maxlength: maxlen,
});

const requiredStringFunction = (maxlen = 500, minlen = 0) => ({
  type: String,
  required: true,
  minlength: minlen,
  maxlength: maxlen,
});


const requiredStringType = {
  type: String,
  required: true,
};

const Url = {
  type: String,
  validate: isUrl,
};


const Email = {
  type: String,
  lowercase: true,
  validate: isEmail,
};

const requiredEmail = {
  ...Email,
  required: true,
};

const indexedEmailType = {
  ...Email,
  unique: true,
  required: [true, 'can\'t be blank'],
  index: true,
};

const requiredPasswordType = {
  type: String,
  required: true,
  match: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/, 'Atleast 6 characters long and must contain one uppercase letter, one lowercase letter and one digit'],
};

module.exports = {
  requiredStringType,
  Url,
  Email,
  requiredEmail,
  indexedEmailType,
  requiredPasswordType,
  stringFunction,
  requiredStringFunction,
};
