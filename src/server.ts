import Koa from "koa";
import send from "koa-send";

const host = process.env.SERVER_HOST || "<Server_IP>";

const server = new Koa();
server.use(async ctx => {
  await send(ctx, `./run/${ctx.path}`);
});

server.listen(8080);

export { host };
