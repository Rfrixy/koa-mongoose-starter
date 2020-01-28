const Router = require('@koa/router');
const { RouterBuilder } = require('../../utils');
const userOperator = require('./userOperator');

const router = new Router();

router.post('/register', RouterBuilder.vanillaPostRequestBuilder(
  userOperator.register
));

// todo: login

module.exports = router;
