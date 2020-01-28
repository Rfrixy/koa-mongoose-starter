const User = require('./userModel');

async function register(data) {
  const user = new User(data);
  await user.save();
  return user;
}

module.exports = {
  register,
};
