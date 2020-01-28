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


const requiredString = {
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

const indexedEmail = {
  ...Email,
  unique: true,
  required: [true, 'can\'t be blank'],
  index: true,
};

const requiredPassword = {
  type: String,
  required: true,
  match: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/, 'Atleast 6 characters long and must contain one uppercase letter, one lowercase letter and one digit'],
};

module.exports = {
  requiredString,
  Url,
  Email,
  requiredEmail,
  indexedEmail,
  requiredPassword,
  stringFunction,
  requiredStringFunction,
};
