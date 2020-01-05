
/**
 * @param {(data: any, options: any) => Promise<any>} operatorFunction
 */
function vanillaGetRequestBuilder(operatorFunction) {
  const middleware = async (ctx, next) => {
    const data = ctx.query;
    const resp = await operatorFunction(data, ctx.operatorOps);
    ctx.state.resp = resp;
    return next();
  };
  return middleware;
}

/**
 * @param {(data: any, options: any) => Promise<any>} operatorFunction
 */
function vanillaPostRequestBuilder(operatorFunction) {
  const middleware = async (ctx, next) => {
    const data = ctx.request.body;
    const resp = await operatorFunction(data, ctx.operatorOps);
    ctx.state.resp = resp;
    return next();
  };
  return middleware;
}

/**
 * @param {(data: any, options: any) => Promise<any>} operatorFunction
 */
function idGetRequestBuilder(operatorFunction) {
  const middleware = async (ctx, next) => {
    const data = ctx.query;
    data.id = ctx.params.id;
    const resp = await operatorFunction(data, ctx.operatorOps);
    ctx.state.resp = resp;
    return next();
  };
  return middleware;
}

/**
 * @param {(data: any, options: any) => Promise<any>} operatorFunction
 */
function idPostRequestBuilder(operatorFunction) {
  const middleware = async (ctx, next) => {
    const data = ctx.request.body;
    data.id = ctx.params.id;
    const resp = await operatorFunction(data, ctx.operatorOps);
    ctx.state.resp = resp;
    return next();
  };
  return middleware;
}


module.exports = {
  vanillaGetRequestBuilder,
  vanillaPostRequestBuilder,
  idGetRequestBuilder,
  idPostRequestBuilder,
};
