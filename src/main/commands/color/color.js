const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.color.name"),
    description: translate("commands.color.description"),
    category: translate("categories.color"),
    args: {
        input: {
            name: translate("commands.color.args.input.name"),
            desc: translate("commands.color.args.input.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        r: {
            name: translate("commands.color.args.r.name"),
            desc: translate("commands.color.args.r.desc"),
            type: "number",
            required: true,
            settings: {
                min: 0,
                max: 255,
                round: true
            }
        },
        g: {
            name: translate("commands.color.args.g.name"),
            desc: translate("commands.color.args.g.desc"),
            type: "number",
            required: true,
            settings: {
                min: 0,
                max: 255,
                round: true
            }
        },
        b: {
            name: translate("commands.color.args.b.name"),
            desc: translate("commands.color.args.b.desc"),
            type: "number",
            required: true,
            settings: {
                min: 0,
                max: 255,
                round: true
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { r, g, b } = args;

        const { path, shortType } = file;

        let tempPath;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${path}" -vf "curves=r='0/${r / 255} 1/1':g='0/${g / 255} 1/1':b='0/${b / 255} 1/1'" \
                    -preset ${args.encodingPreset} -y "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -vf "curves=r='0/${r / 255} 1/1':g='0/${g / 255} 1/1':b='0/${b / 255} 1/1'" \
                    -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p -y "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -vf "curves=r='0/${r / 255} 1/1':g='0/${g / 255} 1/1':b='0/${b / 255} 1/1',\
                    split[pout][ppout];[ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                    -preset ${args.encodingPreset} -gifflags -offsetting -y "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};