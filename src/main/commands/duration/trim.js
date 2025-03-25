const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.trim.name"),
    description: translate("commands.trim.description"),
    category: translate("categories.duration"),
    args: {
        input: {
            name: translate("commands.trim.args.input.name"),
            desc: translate("commands.trim.args.input.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["video", "audio", "gif"]
                }
            }
        },
        start: {
            name: translate("commands.trim.args.start.name"),
            desc: translate("commands.trim.args.start.desc"),
            type: "timestamp",
            required: false,
            settings: {
                dft: 0,
                min: 0,
                max: (args) => args.input?.duration
            }
        },
        end: {
            name: translate("commands.trim.args.end.name"),
            desc: translate("commands.trim.args.end.desc"),
            type: "timestamp",
            required: false,
            settings: {
                dft: (args) => args.input?.duration,
                min: 0,
                max: (args) => args.input?.duration
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { start, end } = args;
        const { path: filePath, shortType: fileType } = file;

        const startTime = start;
        const endTime = end;
        const durationTime = Math.max(0, endTime - startTime);

        let tempPath

        switch (fileType) {
            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -ss ${startTime} -t ${durationTime} -i "${filePath}" \
                    -vf "scale=ceil(iw/2)*2:ceil(ih/2)*2" -preset ${args.encodingPreset} \
                    -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "audio":
                tempPath = makeTempPath("mp3");
                await execPromise(`ffmpeg -ss ${startTime} -t ${durationTime} -i "${filePath}" \
                    -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -ss ${startTime} -t ${durationTime} -i "${filePath}" \
                    -filter_complex "[0:v]split[pout][ppout];[ppout]palettegen=reserve_transparent=1[palette];\
                    [pout][palette]paletteuse=alpha_threshold=128[out]" -map "[out]" \
                    -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};