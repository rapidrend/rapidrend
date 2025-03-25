const path = require("path");

const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.transition.name"),
    description: translate("commands.transition.description"),
    category: translate("categories.animation"),
    args: {
        file1: {
            name: translate("commands.transition.args.file1.name"),
            desc: translate("commands.transition.args.file1.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        file2: {
            name: translate("commands.transition.args.file2.name"),
            desc: translate("commands.transition.args.file2.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        transition: {
            name: translate("commands.transition.args.transition.name"),
            desc: translate("commands.transition.args.transition.desc"),
            type: "string",
            required: false,
            settings: {
                dft: "fade",
                allowed: [
                    'fade', 'wipeleft', 'wiperight', 'wipeup', 'wipedown',
                    'slideleft', 'slideright', 'slideup', 'slidedown',
                    'circlecrop', 'rectcrop', 'distance', 'fadeblack',
                    'fadewhite', 'radial', 'smoothleft', 'smoothright',
                    'smoothup', 'smoothdown', 'circleopen', 'circleclose',
                    'vertopen', 'vertclose', 'horzopen', 'horzclose',
                    'dissolve', 'pixelize', 'diagtl', 'diagtr', 'diagbl',
                    'diagbr', 'hlslice', 'hrslice', 'vuslice', 'vdslice',
                    'random'
                ]
            }
        },
        duration: {
            name: translate("commands.transition.args.duration.name"),
            desc: translate("commands.transition.args.duration.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 1,
                min: 0,
                max: 10
            }
        },
        waitUntilEnd: {
            name: translate("commands.transition.args.waitUntilEnd.name"),
            desc: translate("commands.transition.args.waitUntilEnd.desc"),
            type: "boolean",
            required: false,
            settings: {
                dft: false
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const { transition, file1, file2, duration, waitUntilEnd } = args;
        const { path: file1Path, shortType: file1Type, width, height } = file1;
        const { path: file2Path, shortType: file2Type } = file2;

        // Handle random transition
        const transitions = [
            'fade', 'wipeleft', 'wiperight', 'wipeup', 'wipedown',
            'slideleft', 'slideright', 'slideup', 'slidedown',
            'circlecrop', 'rectcrop', 'distance', 'fadeblack',
            'fadewhite', 'radial', 'smoothleft', 'smoothright',
            'smoothup', 'smoothdown', 'circleopen', 'circleclose',
            'vertopen', 'vertclose', 'horzopen', 'horzclose',
            'dissolve', 'pixelize', 'diagtl', 'diagtr', 'diagbl',
            'diagbr', 'hlslice', 'hrslice', 'vuslice', 'vdslice'
        ];
        const selectedTransition = transition === 'random' ?
            transitions[Math.floor(Math.random() * transitions.length)] :
            transition;

        const tempPath = makeTempPath(file1Type === "video" || file2Type === "video" ? "mp4" : "gif");
        const tempPathData = path.parse(tempPath);
        const tempDir = path.join(tempPathData.dir, tempPathData.name);

        const file1Duration = Number(file1.duration.includes('N/A') ? '0' : file1.duration);
        const file2Duration = Number(file2.duration.includes('N/A') ? '0' : file2.duration);
        const fps = file1.fps.includes('0/0') ? '50' : file1.fps;

        if (duration > 0) {
            // With transition
            if (file1Type === "image" || file2Type === "image") {
                await execPromise(`ffmpeg -stream_loop -1 -t ${duration} -i "${file1Path}" \
                    -stream_loop -1 -t ${duration} -i ${file2Path} \
                    -stream_loop -1 -t ${duration} -i ${path.join(appPath, "assets", "image", "transparent.png")} \
                    -filter_complex "[1:v]scale=-1:${height}[vid];[2:v]scale=${width}:${height}[transparent];\
                    [transparent][vid]overlay=x=W/2-w/2:y=H/2-h/2:format=auto[transition];\
                    [0:v][transition]xfade=transition=${selectedTransition}:duration=${duration},split[gnout][gpout];\
                    [gpout]palettegen=reserve_transparent=1[palette];[gnout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -loop 0 -t ${duration} "${tempPath}"`);
            } else if (file1Type === "video" || file2Type === "video") {
                // Video output
                await execPromise(`ffmpeg -i "${file1Path}" -vf "scale=ceil(iw/2)*2:ceil(ih/2)*2" -c:v libx264 -video_track_timescale 30k -pix_fmt yuv420p -c:a aac -ac 6 -ar 44100 "${tempDir}_concat1.mp4"`);
                await execPromise(`ffmpeg -i "${file2Path}" -vf "scale=ceil(iw/2)*2:ceil(ih/2)*2" -c:v libx264 -video_track_timescale 30k -pix_fmt yuv420p -c:a aac -ac 6 -ar 44100 "${tempDir}_concat2.mp4"`);

                const totalDuration = file1Duration + file2Duration + (waitUntilEnd ? duration : 0);
                const transitionDuration = Math.min(duration, file2Duration);

                await execPromise(`ffmpeg -stream_loop -1 -t ${totalDuration} -i "${tempDir}_concat1.mp4" \
                    -stream_loop -1 -t ${file2Duration} -i "${tempDir}_concat2.mp4" \
                    -stream_loop -1 -t ${file2Duration} -i "${path.join(appPath, "assets", "image", "transparent.png")}" \
                    ${!file1Info.audio && file2Info.audio ? `-stream_loop -1 -t ${file2Duration} -itsoffset ${file1Duration} -i "${tempPath}_concat2.mp4" ` : ''}\
                    -filter_complex "[1:v]scale=-1:${height},scale=ceil(iw/2)*2:ceil(ih/2)*2[vid];[2:v]scale=${width}:${height},scale=ceil(iw/2)*2:ceil(ih/2)*2[transparent];\
                    [transparent][vid]overlay=x=W/2-w/2:y=H/2-h/2:format=auto,fps=${fps}[transition];\
                    [0:v][transition]xfade=transition=${selectedTransition}:duration=${transitionDuration}${file1Duration - duration > duration ? `:offset=${file1Duration - duration + (waitUntilEnd ? duration : 0)}` : ''},scale=ceil(iw/2)*2:ceil(ih/2)*2[out]\
                    ${file1Info.audio && file2Info.audio ? `;[0:a][1:a]acrossfade=d=${duration}[aout]` : ''}" \
                    -map "[out]" ${(file1Info.audio && file2Info.audio) ? '-map "[aout]" ' : (file1Info.audio && !file2Info.audio) ? '-map 0:a ' : (!file1Info.audio && file2Info.audio) ? '-map 3:a ' : ''}\
                    -aspect ${width}:${height} -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p -t ${file1Duration + file2Duration} -y "${tempPath}"`);
            } else {
                // GIF output
                await execPromise(`ffmpeg -stream_loop -1 -t ${file1Duration + (waitUntilEnd ? duration : 0)} -r ${fps} -i "${file1Path}" \
                    -stream_loop -1 -t ${file2Duration} -r ${fps} -i "${file2Path}" \
                    -stream_loop -1 -t ${file2Duration} -r ${fps} -i "${path.join(appPath, "assets", "image", "transparent.png")}" \
                    -filter_complex "[1:v]scale=-1:${height}[vid];[2:v]scale=${width}:${height}[transparent];\
                    [transparent][vid]overlay=x=W/2-w/2:y=H/2-h/2:format=auto,fps=${fps}[transition];\
                    [0:v][transition]xfade=transition=${selectedTransition}:duration=${Math.min(duration, file2Duration)}${file1Duration - duration > duration ? `:offset=${file1Duration - duration + (waitUntilEnd ? duration : 0)}` : ''},\
                    split[gnout][gpout];[gpout]palettegen=reserve_transparent=1[palette];[gnout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -t ${file1Duration + file2Duration} -y "${tempPath}"`);
            }
        } else {
            // Without transition (simple concatenation)
            if (file1Type === "image" && file2Type === "image") {
                await execPromise(`ffmpeg -i "${file1Path}" -i "${file2Path}" -i "${path.join(appPath, "assets", "image", "transparent.png")}" \
                -filter_complex "[1:v]scale=-1:${height}[vid];[2:v]scale=${width}:${height}[transparent];\
                [transparent][vid]overlay=x=W/2-w/2:y=H/2-h/2:format=auto,setsar=sar=1,setdar=dar=1[transition2];\
                [0:v]setsar=sar=1,setdar=dar=1[transition];[transition][transition2]concat,split[gnout][gpout];\
                [gpout]palettegen=reserve_transparent=1[palette];[gnout][palette]paletteuse=alpha_threshold=128[out]" \
                -aspect ${width}:${height} -map "[out]" -preset ${args.encodingPreset} -loop 0 "${tempPath}"`);
            } else if (file1Type === "video" || file2Type === "video") {
                // Video output
                await execPromise(`ffmpeg -i "${file1Path}" -vf "scale=ceil(iw/2)*2:ceil(ih/2)*2" -c:v libx264 \
                    -video_track_timescale 30k -pix_fmt yuv420p -c:a aac -ac 6 -ar 44100 "${tempDir}_concat1.mp4"`);
                await execPromise(`ffmpeg -i "${file2Path}" -vf "scale=ceil(iw/2)*2:ceil(ih/2)*2" -c:v libx264 \
                    -video_track_timescale 30k -pix_fmt yuv420p -c:a aac -ac 6 -ar 44100 "${tempDir}_concat2.mp4"`);

                await execPromise(`ffmpeg -i "${tempDir}_concat1.mp4" -i "${tempDir}_concat2.mp4" \
                    -i "${path.join(appPath, "assets", "image", "transparent.png")}" \
                    ${!file1Info.audio && file2Info.audio ? `-itsoffset ${file1Duration} -i "${tempDir}_concat2.mp4" ` : ''}\
                    -filter_complex "[1:v]scale=-1:${height},scale=ceil(iw/2)*2:ceil(ih/2)*2[vid];[2:v]scale=${width}:${height},scale=ceil(iw/2)*2:ceil(ih/2)*2[transparent];\
                    [transparent][vid]overlay=x=W/2-w/2:y=H/2-h/2:format=auto,setsar=sar=1,setdar=dar=1,fps=${fps}[transition2];\
                    [0:v]setsar=sar=1,setdar=dar=1[transition];[transition][transition2]concat=v=1:a=0,scale=ceil(iw/2)*2:ceil(ih/2)*2[out]\
                    ${file1Info.audio && file2Info.audio ? `;[0:a][1:a]concat=v=0:a=1[aout]` : ''}" \
                    -map "[out]" ${(file1Info.audio && file2Info.audio) ? '-map "[aout]" ' : (file1Info.audio && !file2Info.audio) ? '-map 0:a ' : (!file1Info.audio && file2Info.audio) ? '-map 3:a ' : ''}\
                    -aspect ${width}:${height} -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p -y "${tempPath}"`);
            } else {
                // GIF output
                await execPromise(`ffmpeg -r ${fps} -i "${file1Path}" -r ${fps} -i "${file2Path}" \
                    -r ${fps} -i "${path.join(appPath, "assets", "image", "transparent.png")}" \
                    -filter_complex "[1:v]scale=-1:${height}[vid];[2:v]scale=${width}:${height}[transparent];\
                    [transparent][vid]overlay=x=W/2-w/2:y=H/2-h/2:format=auto,setsar=sar=1,setdar=dar=1,fps=${fps}[transition2];\
                    [0:v]setsar=sar=1,setdar=dar=1[transition];[transition][transition2]concat,split[gnout][gpout];\
                    [gpout]palettegen=reserve_transparent=1[palette];[gnout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -y "${tempPath}"`);
            }
        }

        return new FileEmbed(tempPath);
    }
};