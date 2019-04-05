# HibikiDownloadBot

## How To Use

### Commands

1. Daily Recommend
   `/daily@HibikiDownloadBot`
2. Download
   `/hibiki@HibikiDownloadBot <RADIO_ ID>`
3. Get Playlist and download by yourself
   `/playlist@HibikiDownloadBot <RADIO_ID>`

### Instruction

1. 直接单击蓝色的命令会复读，对没有`<填写项>`的命令有效。
2. 长按蓝色命令可快速将添加其至消息框。
3. 手动下载请使用 ffmpeg，这也是本 Bot 使用的下载方式。

## Docker

```bash
docker pull yesterday17/HibikiDownloadBot
docker run --name hibiki-download-bot -p=SERVER_PORT:8080 -d \
           --env SERVER_HOST="SERVER_HOST" \
           --env SERVER_PORT="SERVER_PORT" \
           --env HIBIKI_DOWNLOAD_BOT_KEY="YOUR_TELEGRAM_TOKEN" \
           yesterday17/HibikiDownloadBot
```

## Build Manually

Before building, Please make sure `ffmpeg` is installed.

1. Environmental Variables

   ```bash
   # Windows
   set HIBIKI_DOWNLOAD_BOT_KEY=<YOUR_Bot_KEY>
   # Others
   export HIBIKI_DOWNLOAD_BOT_KEY="<YOUR_Bot_KEY>"

   # 还有SERVER_HOST和SERVER_PORT需要填写
   ```

   Replace `<YOUR_BOT_KEY>`，**双引号必须保留**。

2. `clone` this repository
   `git clone https://github.com/Yesterday17/HibikiDownloadBot`
3. Download dependencies

   ```bash
   # download it if you don't have yarn
   yarn
   ```

4. Start

   ```bash
   # You can use tools like screen
   screen -S hibiki
   yarn start
   ```
