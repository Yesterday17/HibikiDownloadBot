import TelegramBot from "node-telegram-bot-api";
import { HiBikiDownload, HibikiDownloadCallback } from "./download";
import { getDailyVoice, getPlaylistUrl } from "./request";
import { generateDownloadMessage } from "./utils";

/**
 * Socks5 proxy, only used when debugging
 */
const socks5 = new (require("socks5-https-client/lib/Agent"))({
  socksHost: "127.0.0.1",
  socksPort: "1080"
});

/**
 * Get Telegram Bot KEY
 */
if (process.env.HIBIKI_DOWNLOAD_BOT_KEY === undefined) {
  console.error(
    "Error: Environmental variable HIBIKI_DOWNLOAD_BOT_KEY is required."
  );
  process.exit(1);
}

/**
 * Proxy for debug
 */
const options: TelegramBot.ConstructorOptions = process.env.DEBUG
  ? {
      polling: true,
      request: {
        url: "",
        agent: socks5
      }
    }
  : { polling: true };

/**
 * Bot Instance
 */
export const HiBiKiDownloadBot = new TelegramBot(
  process.env.HIBIKI_DOWNLOAD_BOT_KEY!,
  options
);

/**
 * On command: /playlist <Bangumi ID>
 */
HiBiKiDownloadBot.onText(
  /\/playlist(?:@[^ ]+)? ([0-9]+)/,
  async (msg, match) => {
    const play = await getPlaylistUrl(match![1]);

    if (play.error !== "") {
      await HiBiKiDownloadBot.sendMessage(msg.chat.id, play.error, {
        reply_to_message_id: msg.message_id
      });
      return;
    }

    await HiBiKiDownloadBot.sendMessage(
      msg.chat.id,
      `广播ID: ${match![1]}\n请尽快[下载](${play.reply})以免链接失效!`,
      { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
    );
  }
);

/**
 * On command: /hibiki <Bangumi ID>
 */
HiBiKiDownloadBot.onText(/\/hibiki(?:@[^ ]+)? ([0-9]+)/, async (msg, match) => {
  const id: string = match![1];
  const play = await getPlaylistUrl(id);

  if (play.error !== "") {
    await HiBiKiDownloadBot.sendMessage(
      msg.chat.id,
      generateDownloadMessage(play.error),
      {
        reply_to_message_id: msg.message_id
      }
    );
    return;
  }
  const msg_playlist = await HiBiKiDownloadBot.sendMessage(
    msg.chat.id,
    generateDownloadMessage(`成功获取 Playlist 地址!`),
    {
      reply_to_message_id: msg.message_id
    }
  );

  HiBikiDownload(id, play.reply, HibikiDownloadCallback(msg, msg_playlist, id));
});

HiBiKiDownloadBot.onText(/\/daily(?:@[^ ]+)?/, async (msg, match) => {
  const response = await getDailyVoice();
  if (response.error !== "") {
    return;
  }

  const msg_playlist = await HiBiKiDownloadBot.sendMessage(
    msg.chat.id,
    generateDownloadMessage(`成功获取 Playlist 地址!`),
    {
      reply_to_message_id: msg.message_id
    }
  );

  const body = JSON.parse(response.reply);
  const play = await getPlaylistUrl(body.video.id);
  HiBikiDownload(
    body.video.id,
    play.reply,
    HibikiDownloadCallback(
      msg,
      msg_playlist,
      body.video.id,
      `本日のつぶやき: ${body.name}`
    )
  );
});
