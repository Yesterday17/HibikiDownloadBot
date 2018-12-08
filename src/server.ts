import Koa from "koa";
import send from "koa-send";

const host = "http://server.yesterday17.cn",
  port = 8310;

const server = new Koa();
server.use(async ctx => {
  await send(ctx, `./run/${ctx.path}`);
});

server.listen(8310);

export { host, port };
