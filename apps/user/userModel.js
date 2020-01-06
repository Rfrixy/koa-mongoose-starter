const mongoose = require('mongoose');
const uuid = require('uuid/v4');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcryptjs');
const { MiscUtils, DbPresets } = require('../../utils');


const schema = new mongoose.Schema({
  firstName: DbPresets.requiredStringFunction(50, 2),
  lastName: DbPresets.stringFunction(50, 0),
  name: String,
  email: DbPresets.indexedEmailType,
  password: DbPresets.requiredPasswordType,
  apiKey: { type: String, required: true, index: true },
});

schema.pre('save', function pwdMod(next) {
  const user = this;
  if (this.isModified('password') || this.isNew) {
    user.password = MiscUtils.saltTextSync(user.password);
  }
  if (!this.apiKey || !this.apiKey.length) {
    user.apiKey = uuid();
  }
  return next();
});

schema.set('toObject', { virtuals: true });
schema.set('toJSON', { virtuals: true });

schema.methods.comparePassword = async function comparePassword(passw) {
  let res;
  try {
    res = await bcrypt.compare(passw, this.password);
    return res;
  } catch (err) {
    return false;
  }
};

schema.plugin(uniqueValidator);

exports.User = new mongoose.Model(schema);
