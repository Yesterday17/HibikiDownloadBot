import request from "request-promise";
import ffmpeg from "fluent-ffmpeg";
import TelegramBot from "node-telegram-bot-api";
import { createReadStream } from "fs";

if (process.env.HIBIKI_DOWNLOAD_BOT_KEY === undefined) {
  console.error(
    "Error: Environmental variable HIBIKI_DOWNLOAD_BOT_KEY is required."
  );
  process.exit();
}

const header = `HibikiDownloadBot v1.0.0`;
const bot = new TelegramBot(process.env.HIBIKI_DOWNLOAD_BOT_KEY!, {
  polling: true
});

bot.onText(/\/playlist(?:@[^ ]+)? ([0-9]+)/, async (msg, match) => {
  const play = await getPlaylistUrl(match![0]);

  if (play.error !== "") {
    bot.sendMessage(msg.chat.id, play.error);
    return;
  }

  bot.sendMessage(
    msg.chat.id,
    `广播ID: ${match![0]}  \nPlaylist 地址: \n${
      play.url
    }  \n请**尽快**下载以免链接失效！`,
    { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
  );
});

bot.onText(/\/hibiki(?:@[^ ]+)? ([0-9]+)/, async (msg, match) => {
  const id: string = match![0];
  const play = await getPlaylistUrl(id);

  if (play.error !== "") {
    bot.sendMessage(msg.chat.id, generateDownloadMessage(header, play.error), {
      reply_to_message_id: msg.message_id
    });
    return;
  }
  const msg_playlist = await bot.sendMessage(
    msg.chat.id,
    generateDownloadMessage(header, `成功获取 Playlist 地址: \n${play.url}`),
    {
      reply_to_message_id: msg.message_id
    }
  );

  const start = () => {
    bot.editMessageText(
      generateDownloadMessage(header, play.url, `开始下载……\n下载进度:0.00%`),
      {
        chat_id: msg_playlist.chat.id,
        message_id: msg_playlist.message_id
      }
    );
  };

  const progress = (progress: any) => {
    bot.editMessageText(
      generateDownloadMessage(
        header,
        play.url,
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
      generateDownloadMessage(header, play.url, `下载成功!`),
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
          play.url,
          `下载成功!`,
          `文件大小: ${size}M`
        ),
        {
          chat_id: msg_playlist.chat.id,
          message_id: msg_playlist.message_id
        }
      );
      if (size < 49.5) {
        bot.sendVideo(msg.chat.id, createReadStream(`./run/${id}.mp4`), {});
      } else {
        // split
      }
    });
  };
  const error = (err: any, stdout: any, stderr: any) => {
    bot.editMessageText(
      generateDownloadMessage(
        header,
        play.url,
        `下载失败！错误: ${stderr.message}`
      ),
      {
        chat_id: msg_playlist.chat.id,
        message_id: msg_playlist.message_id
      }
    );
  };
  download(id, play.url, { start, progress, end, error });
});

function generateDownloadMessage(
  header?: string,
  playlist?: string,
  progress?: string,
  filesize?: string
): string {
  let ans = "";
  if (header) ans += header;
  if (playlist) ans += `\n${playlist}`;
  if (progress) ans += `\n${progress}`;
  if (filesize) ans += `\n${filesize}`;
  return ans;
}

async function getPlaylistUrl(
  id: string
): Promise<{ error: string; url: string }> {
  return await request
    .get(
      `https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id=${id}`,
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        }
      }
    )
    .then(body => {
      const reply = JSON.parse(body);
      if (!reply.playlist_url) {
        return {
          error: `无法获取下载地址!!!\nID: ${id}\n错误信息: ${
            reply.error_message
          }`,
          url: ""
        };
      }
      return { error: "", url: reply.playlist_url };
    })
    .catch(error => {
      return { error: error, url: "" };
    });
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
