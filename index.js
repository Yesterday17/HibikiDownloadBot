const Telegraf = require("telegraf");

const bot = new Telegraf(process.env.HIBIKI_DOWNLOAD_BOT_KEY, {
  username: "HibikiDownloadBot"
});

bot.command("hibiki", ctx => {
  const id = ctx.message.text.slice(8);
  request.get(
    `https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id=${id}`,
    {
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      }
    },
    (err, res, body) => {
      ctx.replyWithVideo({
        source: createReadStream(`${id}.mp4`)
      });
      return;

      const reply = JSON.parse(body);
      if (!reply.playlist_url) {
        ctx.reply(
          `无法获取下载地址!!!\nID: ${id}\n错误信息: ${reply.error_message}`
        );
        return;
      }
      ctx.reply(`成功获取 Playlist 地址: \n${reply.playlist_url}`);
      let pastPercent = -10;
      ffmpeg()
        .input(reply.playlist_url)
        .on("start", () => {
          ctx.reply(`开始下载……`);
          console.log(`开始下载……`);
        })
        .on("progress", function(progress) {
          if (Math.trunc(progress.percent) - pastPercent < 10) return;
          ctx.reply(`下载中... ${Math.trunc(progress.percent)}%`);
          pastPercent = Math.trunc(progress.percent);
        })
        .on("end", () => {
          ctx.reply(`下载成功！`);
          ctx.replyWithVideo({
            source: createReadStream(`${id}.mp4`)
          });
        })
        .save(`${id}.mp4`);
    }
  );
});

bot.startPolling();
