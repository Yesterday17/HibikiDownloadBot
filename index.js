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
      let downloadMessage;
      ffmpeg()
        .input(reply.playlist_url)
        .outputOptions("-strict -2")
        .on("start", () => {
          ctx.reply(`开始下载……`);
          ctx.reply(`下载中...`).then(message => (downloadMessage = message));
        })
        .on("progress", function(progress) {
          if (downloadMessage) {
            ctx.telegram.editMessageText(
              downloadMessage.chat.id,
              downloadMessage.message_id,
              null,
              progress.percent.toString()
            );
          }
        })
        .on("error", function(err, stdout, stderr) {
          ctx.reply(`无法下载! ${stderr.message}`);
        })
        .on("end", () => {
          ctx.reply(`下载成功！`);
          ctx.replyWithVideo({
            source: fs.createReadStream(`${id}.mp4`)
          });
        })
        .save(`${id}.mp4`);
    }
  );
});

bot.startPolling();
