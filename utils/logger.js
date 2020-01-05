const pino = require('pino');
const pinoHttp = require('pino-http');

const logger = pino({
  prettyPrint: true,
});

exports.logger = logger.child({ label: 'Default' });

exports.getLoggerMiddleware = () => {
  const httpMiddleware = pinoHttp({
    logger: logger.child({ label: 'ROUTES' }),
    customLogLevel(res, err) {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn';
      } if (res.statusCode >= 500 || err) {
        return 'error';
      }
      return 'info';
    },
    autoLogging: true,
  });

  return (ctx, next) => {
    httpMiddleware(ctx.req, ctx.res);
    ctx.logger = ctx.req.log;
    return next();
  };
};

const errHandler = (err, type) => {
  logger.error({ err }, type);
  process.exit(3);
};

process.on('uncaughtException', (err) => {
  errHandler(err, 'uncaughtException');
});

process.on('unhandledRejection', (err) => {
  errHandler(err, 'unhandledRejection');
});
