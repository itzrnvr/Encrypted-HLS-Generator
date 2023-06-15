const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { isModuleNamespaceObject } = require('util/types');
const ffmpegPath = require('ffmpeg-static').replace(
    'app.asar',
    'app.asar.unpacked'
);
const ffprobePath = require('ffprobe-static').path.replace(
    'app.asar',
    'app.asar.unpacked'
);
//tell the ffmpeg package where it can find the needed binaries.
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Video resolutions
const resolutions = [
  { width: 640, height: 360 },
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 }
];

const keyInfoFilePath = path.join(__dirname, `../../enc.keyinfo`);

// Generate encrypted HLS with multiple video resolutions

const cleanName = function(name) {
  name = name.replace(/\s+/gi, '-'); // Replace white space with dash
  return name.replace(/[^a-zA-Z0-9\-]/gi, ''); // Strip any special charactere
};


function generateEncryptedHLS(inputFileName, inputFilePath, outputDirectory, callback) {
  const outFilePath = `${outputDirectory}/${cleanName(path.parse(inputFileName).name)}`
  fs.mkdirSync(outFilePath);
  console.log(outFilePath)
  ffmpeg()
  .input(inputFilePath)
  .addOutputOptions([
    '-preset slow', '-g 48', '-sc_threshold 0',
    '-map 0:0', '-map 0:1',
    '-map 0:0', '-map 0:1',
    '-map 0:0', '-map 0:1',
    '-map 0:0', '-map 0:1',
    '-s:v:0 640x360', '-c:v:0 libx264', '-b:v:0 365k',
    '-s:v:1 854x480', '-c:v:1 libx264', '-b:v:1 800k',
    '-s:v:2 1280x720', '-c:v:2 libx264', '-b:v:2 4000k',
    '-s:v:3 1920x1080', '-c:v:3 libx264', '-b:v:3 8000k',
    '-c:a copy',
    '-f hls', '-hls_time 10', '-hls_list_size 0', `-hls_key_info_file ${keyInfoFilePath}`,
    `-hls_segment_filename ${outFilePath}/v%v/fileSequence%d.ts`,
    '-master_pl_name master.m3u8'
  ])
  .outputOption('-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3')
  .output(`${outFilePath}/v%v/prog_index.m3u8`)
  .on('codecData', data => {
    callback('codecData', data)
  })
  .on('progress', progress => {
    callback('progress', progress)
  })
  .on('error', function(err, stdout, stderr) {
    callback('error', err)
    console.log("ffmpeg stdout:\n" + stdout);
    console.log("ffmpeg stderr:\n" + stderr);
  })
  .on('end', function(err, stdout, stderr) {    
    callback('end', 'ended')
    console.log(stdout);
    console.log(err);
    console.log(stderr);
  })
  .run()
  console.log("fromGenerateEncryptedHLS")
}




module.exports = {generateEncryptedHLS}

//ffmpeg -y -i sample.mp4 -preset slow -g 48 -sc_threshold 0 -map 0:0 -map 0:1 -map 0:0 -map 0:1 -s:v:0 640x360 -c:v:0 libx264 -b:v:0 365k -s:v:1 960x540 -c:v:1 libx264 -b:v:1 2000k  -c:a copy -var_stream_map "v:0,a:0 v:1,a:1" -master_pl_name master.m3u8 -f hls -hls_time 6 -hls_list_size 0 -hls_segment_filename "v%v/fileSequence%d.ts" v%v/prog_index.m3u8