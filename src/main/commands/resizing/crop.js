const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");
const { parseNumber } = require("#functions/arguments");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.crop.name"),
    description: translate("commands.crop.description"),
    category: translate("categories.resizing"),
    args: {
        input: {
            name: translate("commands.crop.args.input.name"),
            desc: translate("commands.crop.args.input.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        x: {
            name: translate("commands.crop.args.x.name"),
            desc: translate("commands.crop.args.x.desc"),
            type: "pixels",
            required: false,
            settings: {
                dft: 0,
                min: 0,
                max: (args) => args.input && args.input.width - 1
            }
        },
        y: {
            name: translate("commands.crop.args.y.name"),
            desc: translate("commands.crop.args.y.desc"),
            type: "pixels",
            required: false,
            settings: {
                dft: 0,
                min: 0,
                max: (args) => args.input && args.input.height - 1
            }
        },
        w: {
            name: translate("commands.crop.args.w.name"),
            desc: translate("commands.crop.args.w.desc"),
            type: "pixels",
            required: false,
            settings: {
                dft: (args) => args.input?.width,
                min: 1,
                max: (args) => args.input?.width
            }
        },
        h: {
            name: translate("commands.crop.args.h.name"),
            desc: translate("commands.crop.args.h.desc"),
            type: "pixels",
            required: false,
            settings: {
                dft: (args) => args.input?.height,
                min: 1,
                max: (args) => args.input?.height
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        let { x, y, w, h } = args;

        const { path, shortType, width, height } = file;

        let tempPath;
        
        w = parseNumber(w, { min: 1, max: width - x, dft: width });
        h = parseNumber(h, { min: 1, max: height - y, dft: height });

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${path}" -vf "crop=${w}:${h}:${x}:${y}" \
                    -preset ${args.encodingPreset} -y "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -vf "crop=${w}:${h}:${x}:${y}" \
                    -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p -y "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -vf "crop=${w}:${h}:${x}:${y},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                    -preset ${args.encodingPreset} -gifflags -offsetting -y "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};