const Router = require('@koa/router');

const authenticator = require('./apps/auth/authenticator');
const middleware = require('./middleware');


const User = require('./apps/user/userRouter');


const router = new Router({
  prefix: '/api',
});


// trimming req parameters
router.use(middleware.trimReqParams);
router.use(middleware.removeSquareBrackets);

const postMiddlewares = [
  middleware.sendCookieMiddleware,
  middleware.sendResponseMiddleware,
  middleware.invalidUrlMiddleware,
];

// Keep paths that require authentication below here
router.use(authenticator.authenticate);

router.use('/user',
  User.routes(),
  User.allowedMethods(),
  ...postMiddlewares);

module.exports = router;
