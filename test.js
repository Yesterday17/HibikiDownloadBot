const request = require("request");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

function download(id, url) {
  let downloadMessage,
    limitPercent = 0;
  ffmpeg()
    .input(url)
    .videoCodec("libx264")
    .audioCodec("libmp3lame")
    .withAudioBitrate("128k")
    .outputOptions("-strict -2")
    .on("start", () => {
      console.log(`Start downloading...`);
    })
    .on("progress", function(progress) {
      console.log(`Progress: ${progress.percent}%`);
    })
    .on("error", function(err, stdout, stderr) {
      console.error(`Failed to download: ${stderr.message}`);
    })
    .on("end", () => {
      if (downloadMessage) {
        console.log("Downloaded successfully!");
      }
    })
    .save(`./run/${id}.mp4`);
}

function sendVideo(id, sendFunction) {
  ffmpeg.ffprobe(`./run/${id}.mp4`, function(err, data) {
    console.log(data.format.size / 1024 / 1024);
  });
}

function run() {
  const id = "8310";
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
        console.error(
          `Cannot fetch playlist URL!\nID: ${id}\nError message: ${
            reply.error_message
          }`
        );
        return;
      }
      console.log(`Playlist Address: \n${reply.playlist_url}`);
      download(id, reply.playlist_url);
    }
  );
}

run();
