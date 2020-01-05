const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const cfg = require('@smpx/cfg');
const { logger, getLoggerMiddleware } = require('./utils');
const { parser } = require('./utils/errorParser');

const app = new Koa();

app.use(getLoggerMiddleware());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    // Errors without status code are not thrown willingly (i.e. not from ctx.throw)
    if (!err.statusCode) {
      ctx.logger.error({ err }, 'Unexpected error');
      err.message = 'Unexpected error occured';
      err.statusCode = 500;
    }
    ctx.status = err.statusCode;
    ctx.body = parser(err);
  }
});

app.use(bodyParser({
  jsonLimit: '50mb',
  onerror(err, ctx) {
    ctx.throw(400, 'Please send valid JSON');
  },
}));

app.use(cors({
  credentials: true,
}));

// app.use(api.routes())
//   .use(api.allowedMethods({
//     throw: true,
//   }));

app.use((ctx) => {
  ctx.throw(404, 'Invalid url or method');
});

async function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(cfg('basePort'), () => {
      logger.info(`Listening on port ${server.address().port}`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer();
}
