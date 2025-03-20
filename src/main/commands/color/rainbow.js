const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.rainbow.name"),
    description: translate("commands.rainbow.description"),
    category: translate("categories.color"),
    args: {
        input: {
            name: translate("commands.rainbow.args.input.name"),
            desc: translate("commands.rainbow.args.input.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        duration: {
            name: translate("commands.rainbow.args.duration.name"),
            desc: translate("commands.rainbow.args.duration.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 1,
                min: 0.1,
                max: 10
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const duration = args.duration;

        const { path, shortType } = file;

        let tempPath;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -stream_loop -1 -t ${duration} -i "${path}" \
                    -vf "hue=H=2*PI*t:negate,split[pout][ppout];[ppout]palettegen=reserve_transparent=1[palette];\
                    [pout][palette]paletteuse=alpha_threshold=128" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -vf "hue=H=2*PI*t:negate" -preset ${args.encodingPreset} \
                    -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -vf "hue=H=2*PI*t:negate,split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                    -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};