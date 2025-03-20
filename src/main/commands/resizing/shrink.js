const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.shrink.name"),
    description: translate("commands.shrink.description"),
    category: translate("categories.resizing"),
    args: {
        input: {
            name: translate("commands.shrink.args.input.name"),
            desc: translate("commands.shrink.args.input.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        multiplier: {
            name: translate("commands.shrink.args.multiplier.name"),
            desc: translate("commands.shrink.args.multiplier.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 2,
                min: 1,
                max: 6
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const multiplier = args.multiplier;

        const { path, shortType } = file;

        let tempPath;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${path}" -vf "scale=iw/${multiplier}:ih/${multiplier}" \
                    -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -vf "scale=iw/${multiplier}:ih/${multiplier}" \
                    -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -vf "scale=iw/${multiplier}:ih/${multiplier},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                    -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};