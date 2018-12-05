const Telegraf = require("telegraf");
const request = require("request");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

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
      const reply = JSON.parse(body);
      if (!reply.playlist_url) {
        ctx.reply(
          `无法获取下载地址!!!\nID: ${id}\n错误信息: ${reply.error_message}`
        );
        return;
      }
      ctx.reply(`成功获取 Playlist 地址: \n${reply.playlist_url}`);
      let downloadMessage,
        limitPercent = 0;
      ffmpeg()
        .input(reply.playlist_url)
        .outputOptions("-strict -2")
        .on("start", () => {
          ctx
            .reply(`开始下载……\n下载进度: `)
            .then(message => (downloadMessage = message));
        })
        .on("progress", function(progress) {
          if (downloadMessage && progress.percent - limitPercent > 5) {
            ctx.telegram.editMessageText(
              downloadMessage.chat.id,
              downloadMessage.message_id,
              null,
              `开始下载……\n下载进度: ${progress.percent.toFixed(2)}%`
            );
            limitPercent = progress.percent;
          }
        })
        .on("error", function(err, stdout, stderr) {
          ctx.telegram.editMessageText(
            downloadMessage.chat.id,
            downloadMessage.message_id,
            null,
            `下载失败！错误: ${stderr.message}`
          );
        })
        .on("end", () => {
          if (downloadMessage) {
            ctx.telegram.editMessageText(
              downloadMessage.chat.id,
              downloadMessage.message_id,
              null,
              "下载成功！"
            );
          }
          ctx.replyWithVideo({
            source: fs.createReadStream(`${id}.mp4`)
          });
        })
        .save(`${id}.mp4`);
    }
  );
});

bot.startPolling();
