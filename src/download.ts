import ffmpeg from "fluent-ffmpeg";
import { createReadStream, unlink } from "fs";
import { Message } from "node-telegram-bot-api";
import { HiBiKiDownloadBot } from "./index";
import { host, port } from "./server";
import { generateDownloadMessage } from "./utils";

export function HibikiDownloadCallback(
  origin: Message,
  reply: Message,
  id: string,
  name?: string
): {
  start: () => void;
  progress: (progress: any) => void;
  end: () => void;
  error: (...args: any[]) => void;
} {
  let progress_time = 0;

  const start = async () => {
    await HiBiKiDownloadBot.editMessageText(
      generateDownloadMessage(
        `成功获取 Playlist 地址!`,
        `开始下载……\n下载进度: 0.00%`
      ),
      {
        chat_id: reply.chat.id,
        message_id: reply.message_id
      }
    );
  };

  const progress = async (progress: any) => {
    if (Date.now() - progress_time < 2000) return;

    progress_time = Date.now();
    await HiBiKiDownloadBot.editMessageText(
      generateDownloadMessage(
        `成功获取 Playlist 地址!`,
        `开始下载……\n下载进度: ${progress.percent.toFixed(2)}%`
      ),
      {
        chat_id: reply.chat.id,
        message_id: reply.message_id
      }
    );
  };

  const end = async () => {
    await HiBiKiDownloadBot.editMessageText(
      generateDownloadMessage(`成功获取 Playlist 地址!`, `下载成功!`),
      {
        chat_id: reply.chat.id,
        message_id: reply.message_id
      }
    );

    // Upload
    ffmpeg.ffprobe(`./run/${id}.mp4`, async function(err, data) {
      const size = data.format.size / 1024 / 1024;
      await HiBiKiDownloadBot.editMessageText(
        generateDownloadMessage(
          `成功获取 Playlist 地址!`,
          `下载成功!`,
          `文件大小: ${size.toFixed(2)}M`
        ),
        {
          chat_id: reply.chat.id,
          message_id: reply.message_id
        }
      );
      if (size < 49.5) {
        await HiBiKiDownloadBot.editMessageText(
          generateDownloadMessage(
            `成功获取 Playlist 地址!`,
            `下载成功!`,
            `文件大小: ${size.toFixed(2)}M`,
            `上传中……`
          ),
          {
            chat_id: reply.chat.id,
            message_id: reply.message_id
          }
        );
        await HiBiKiDownloadBot.sendVideo(
          origin.chat.id,
          createReadStream(`./run/${id}.mp4`),
          {
            caption: name ? name : `HiBiKi Radio Station - ${id}`,
            duration: data.format.duration,
            reply_to_message_id: origin.message_id
          }
        ).then(message => {
          // TODO: Store video id
          unlink(`./run/${id}.mp4`, async err => {
            if (err) {
              console.error(`Can't remove file: ./run/${id}.mp4`);

              await HiBiKiDownloadBot.sendMessage(
                origin.chat.id,
                `错误：无法移除已经发送至Telegram的本地视频，请通知管理员！`,
                {
                  reply_to_message_id: message.message_id
                }
              );
            }
          });
        });
      } else {
        // TODO: Split file instead of saving it on server.
        await HiBiKiDownloadBot.sendMessage(
          origin.chat.id,
          `文件过大，无法通过 Telegram 直接传输！\n请至 ${host}:${port}/${id}.mp4 下载！`,
          {
            reply_to_message_id: origin.message_id
          }
        );
      }

      await HiBiKiDownloadBot.deleteMessage(
        reply.chat.id,
        reply.message_id.toString()
      );
    });
  };
  const error = async (err: any, stdout: any, stderr: any) => {
    await HiBiKiDownloadBot.editMessageText(
      generateDownloadMessage(
        `成功获取 Playlist 地址!`,
        `下载失败! 错误: ${stderr.message}`
      ),
      {
        chat_id: reply.chat.id,
        message_id: reply.message_id
      }
    );
  };
  return { start, progress, end, error };
}

export function HiBikiDownload(
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
    // .videoCodec("libx264")
    // .videoBitrate(1000)
    // .audioCodec("libmp3lame")
    // .withAudioBitrate("128k")
    .outputOptions("-strict -2")
    .on("start", callbacks.start)
    .on("progress", callbacks.progress)
    .on("error", callbacks.error)
    .on("end", callbacks.end)
    .save(`./run/${id}.mp4`);
}
