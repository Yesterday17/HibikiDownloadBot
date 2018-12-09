# HibikiDownloadBot

## 使用说明

### 一、命令

1. 日推
   `/daily@HibikiDownloadBot`
2. 下载
   `/hibiki@HibikiDownloadBot <广播 ID>`
3. 获得 Playlist 手动下载
   `/playlist@HibikiDownloadBot <广播 ID>`

### 二、说明

1. 直接单击蓝色的命令会复读，对没有`<填写项>`的命令有效。
2. 长按蓝色命令可快速将添加其至消息框。
3. 手动下载请使用 ffmpeg，这也是本 Bot 使用的下载方式。

## 手动搭建

再搭建之前，请确保您的机器上安装有`ffmpeg`。`ffmpeg`的安装此处不赘述。安装完后，请遵循以下步骤：

1. 环境变量
   ```bash
   # Windows
   set HIBIKI_DOWNLOAD_BOT_KEY=<你的Bot_KEY>
   # Others
   export HIBIKI_DOWNLOAD_BOT_KEY="<你的Bot_KEY>"
   ```
   替换`<你的Bot_KEY>`，**双引号必须保留**。
2. `clone`此项目
   `git clone https://github.com/Yesterday17/HibikiDownloadBot`
3. 下载依赖

   ```bash
   # 没有 yarn 请自行安装
   yarn

   # 不建议的 npm
   npm install
   ```

4. 启动

   ```bash
   # 建议使用诸如 screen 的工具
   # 此处使用 screen演示
   screen -S hibiki
   yarn start

   # 当只有 npm 时
   npm run start
   ```
