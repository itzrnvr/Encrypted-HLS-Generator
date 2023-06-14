const fs = require('fs');
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


const videoIn = './sample.mp4';
const videoOut = 'master';
const hlsTime = 4;
const fps = 25;
const gopSize = 100;
const crfP = 21;
const presetP = 'veryfast';
const vSize1 = '960x540';
const vSize2 = '416x234';
const vSize3 = '640x360';
const vSize4 = '768x432';
const vSize5 = '1280x720';
const vSize6 = '1920x1080';

const conv = ffmpeg();

// HLS
conv.input(videoIn)
    .preset(presetP)
    .keyint_min(gopSize)
    .g(gopSize)
    .sc_threshold(0)
    .r(fps)
    .c('libx264')
    .pix_fmt('yuv420p')
    .crf(crfP)
    .map('v:0')
    .size(vSize1)
    .maxrate(2000000)
    .bufsize(4000000)
    .map('v:0')
    .size(vSize2)
    .maxrate(145000)
    .bufsize(290000)
    .map('v:0')
    .size(vSize3)
    .maxrate(365000)
    .bufsize(730000)
    .map('v:0')
    .size(vSize4)
    .maxrate(730000)
    .bufsize(1460000)
    .map('v:0')
    .size(vSize4)
    .maxrate(1100000)
    .bufsize(2200000)
    .map('v:0')
    .size(vSize5)
    .maxrate(3000000)
    .bufsize(6000000)
    .map('v:0')
    .size(vSize5)
    .maxrate(4500000)
    .bufsize(9000000)
    .map('v:0')
    .size(vSize6)
    .maxrate(6000000)
    .bufsize(12000000)
    .map('v:0')
    .size(vSize6)
    .maxrate(7800000)
    .bufsize(15600000)
    .map('a:0')
    .c('aac')
    .b(128000)
    .ac(1)
    .ar(44100)
    .output('hls', {
        time: hlsTime,
        playlist_type: 'vod',
        flags: 'independent_segments',
        master_pl_name: `${videoOut}.m3u8`,
        segment_filename: 'stream_%v/s%06d.ts',
        strftime_mkdir: 1,
        var_stream_map: `v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3 v:4,a:4 v:5,a:5 v:6,a:6 v:7,a:7 v:8,a:8`
    });

conv.run();