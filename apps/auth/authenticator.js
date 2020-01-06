const { User } = require('../user/userModel');

async function authenticate(ctx, next) {
  const apiKey = ctx.query.apiKey || ctx.headers.apiKey;
  if (!apiKey) ctx.throw(401, 'Forbidden');
  const user = await User.findOne({ apiKey });
  if (!user) ctx.throw(401, 'Forbidden');
  ctx.user = user;
  next();
}

module.exports = authenticate;
