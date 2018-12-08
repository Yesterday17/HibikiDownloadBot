import request from "request-promise";
import ffmpeg from "fluent-ffmpeg";
import TelegramBot from "node-telegram-bot-api";
import { createReadStream, unlink } from "fs";
import { host, port } from "./server";

const socks5 = new (require("socks5-https-client/lib/Agent"))({
  socksHost: "127.0.0.1",
  socksPort: "1080"
});

if (process.env.HIBIKI_DOWNLOAD_BOT_KEY === undefined) {
  console.error(
    "Error: Environmental variable HIBIKI_DOWNLOAD_BOT_KEY is required."
  );
  process.exit();
}

const header = `HibikiDownloadBot v1.0.0`;
const options: TelegramBot.ConstructorOptions = process.env.DEBUG
  ? {
      polling: true,
      request: {
        url: "",
        agent: socks5
      }
    }
  : { polling: true };
const bot = new TelegramBot(process.env.HIBIKI_DOWNLOAD_BOT_KEY!, options);

bot.onText(/\/playlist(?:@[^ ]+)? ([0-9]+)/, async (msg, match) => {
  const play = await getPlaylistUrl(match![1]);

  if (play.error !== "") {
    bot.sendMessage(msg.chat.id, play.error, {
      reply_to_message_id: msg.message_id
    });
    return;
  }

  bot.sendMessage(
    msg.chat.id,
    `广播ID: ${match![1]}\n请尽快[下载](${play.url})以免链接失效!`,
    { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
  );
});

bot.onText(/\/hibiki(?:@[^ ]+)? ([0-9]+)/, async (msg, match) => {
  const id: string = match![1];
  const play = await getPlaylistUrl(id);

  if (play.error !== "") {
    bot.sendMessage(msg.chat.id, generateDownloadMessage(header, play.error), {
      reply_to_message_id: msg.message_id
    });
    return;
  }
  const msg_playlist = await bot.sendMessage(
    msg.chat.id,
    generateDownloadMessage(header, `成功获取 Playlist 地址!`),
    {
      reply_to_message_id: msg.message_id
    }
  );

  let progress_time = 0;

  const start = () => {
    bot.editMessageText(
      generateDownloadMessage(
        header,
        `成功获取 Playlist 地址!`,
        `开始下载……\n下载进度: 0.00%`
      ),
      {
        chat_id: msg_playlist.chat.id,
        message_id: msg_playlist.message_id
      }
    );
  };

  const progress = (progress: any) => {
    if (Date.now() - progress_time < 2000) return;

    progress_time = Date.now();
    bot.editMessageText(
      generateDownloadMessage(
        header,
        `成功获取 Playlist 地址!`,
        `开始下载……\n下载进度: ${progress.percent.toFixed(2)}%`
      ),
      {
        chat_id: msg_playlist.chat.id,
        message_id: msg_playlist.message_id
      }
    );
  };

  const end = () => {
    bot.editMessageText(
      generateDownloadMessage(header, `成功获取 Playlist 地址!`, `下载成功!`),
      {
        chat_id: msg_playlist.chat.id,
        message_id: msg_playlist.message_id
      }
    );

    // Upload
    ffmpeg.ffprobe(`./run/${id}.mp4`, function(err, data) {
      const size = data.format.size / 1024 / 1024;
      bot.editMessageText(
        generateDownloadMessage(
          header,
          `成功获取 Playlist 地址!`,
          `下载成功!`,
          `文件大小: ${size.toFixed(2)}M`
        ),
        {
          chat_id: msg_playlist.chat.id,
          message_id: msg_playlist.message_id
        }
      );
      if (size < 49.5) {
        bot.editMessageText(
          generateDownloadMessage(
            header,
            `成功获取 Playlist 地址!`,
            `下载成功!`,
            `文件大小: ${size.toFixed(2)}M`,
            `上传中……`
          ),
          {
            chat_id: msg_playlist.chat.id,
            message_id: msg_playlist.message_id
          }
        );
        bot
          .sendVideo(msg.chat.id, createReadStream(`./run/${id}.mp4`), {
            caption: id,
            duration: data.format.duration
          })
          .then(message => {
            // TODO: Store video id
            unlink(`./run/${id}.mp4`, err => {
              if (!err) return;

              console.error(`Can't remove file: ./run/${id}.mp4`);

              bot.editMessageText(
                generateDownloadMessage(
                  header,
                  `成功获取 Playlist 地址!`,
                  `下载成功!`,
                  `文件大小: ${size.toFixed(2)}M`,
                  `错误：无法移除已经发送至Telegram的本地视频，请通知管理员！`
                ),
                {
                  chat_id: msg_playlist.chat.id,
                  message_id: msg_playlist.message_id
                }
              );
            });
          });
      } else {
        // TODO: Split file instead of saving it on server.
        bot.editMessageText(
          generateDownloadMessage(
            header,
            `成功获取 Playlist 地址!`,
            `下载成功!`,
            `文件大小: ${size.toFixed(2)}M`,
            `文件过大，无法通过 Telegram 直接传输`,
            `请至 ${host}:${port}/${id}.mp4 下载！`
          ),
          {
            chat_id: msg_playlist.chat.id,
            message_id: msg_playlist.message_id
          }
        );
      }
    });
  };
  const error = (err: any, stdout: any, stderr: any) => {
    bot.editMessageText(
      generateDownloadMessage(
        header,
        `成功获取 Playlist 地址!`,
        `下载失败! 错误: ${stderr.message}`
      ),
      {
        chat_id: msg_playlist.chat.id,
        message_id: msg_playlist.message_id
      }
    );
  };
  download(id, play.url, { start, progress, end, error });
});

function generateDownloadMessage(...args: string[]): string {
  let ans = "";
  for (const str of arguments) {
    ans += `\n${str}`;
  }
  return ans.substring(1);
}

async function getPlaylistUrl(
  id: string
): Promise<{ error: string; url: string }> {
  const body = await request.get(
    `https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id=${id}`,
    {
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      }
    }
  );
  if (!body) return { error: "发生错误！", url: "" };

  const reply = JSON.parse(body);
  if (!reply.playlist_url) {
    return {
      error: `无法获取下载地址!!!\nID: ${id}\n错误信息: ${reply.error_message}`,
      url: ""
    };
  }
  return { error: "", url: reply.playlist_url };
}

function download(
  id: string,
  url: string,
  callbacks: {
    start: () => void;
    progress: (progress: any) => void;
    end: () => void;
    error: (...args: any[]) => void;
  }
) {
  ffmpeg()
    .input(url)
    .videoCodec("libx264")
    .videoBitrate(1000)
    .audioCodec("libmp3lame")
    .withAudioBitrate("128k")
    .outputOptions("-strict -2")
    .on("start", callbacks.start)
    .on("progress", callbacks.progress)
    .on("error", callbacks.error)
    .on("end", callbacks.end)
    .save(`./run/${id}.mp4`);
}
