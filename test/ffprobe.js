const ffmpeg = require("fluent-ffmpeg");

const ID = "8310";

ffmpeg.ffprobe(`./run/${ID}.mp4`, (err, data) => {
  console.log(data);
});
