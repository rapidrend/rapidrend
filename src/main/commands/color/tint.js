const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.tint.name"),
    description: translate("commands.tint.description"),
    category: translate("categories.color"),
    args: {
        input: {
            name: translate("commands.tint.args.input.name"),
            desc: translate("commands.tint.args.input.desc"),
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
            name: translate("commands.tint.args.r.name"),
            desc: translate("commands.tint.args.r.desc"),
            type: "number",
            required: true,
            settings: {
                min: 0,
                max: 255,
                round: true
            }
        },
        g: {
            name: translate("commands.tint.args.g.name"),
            desc: translate("commands.tint.args.g.desc"),
            type: "number",
            required: true,
            settings: {
                min: 0,
                max: 255,
                round: true
            }
        },
        b: {
            name: translate("commands.tint.args.b.name"),
            desc: translate("commands.tint.args.b.desc"),
            type: "number",
            required: true,
            settings: {
                min: 0,
                max: 255,
                round: true
            }
        },
        a: {
            name: translate("commands.tint.args.a.name"),
            desc: translate("commands.tint.args.a.desc"),
            type: "number",
            required: false,
            settings: {
                min: 0,
                max: 255,
                dft: 255,
                round: true
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { r, g, b, a } = args;

        const { path, shortType } = file;

        let tempPath;

        const color = `0x${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${path}" -f lavfi -i "color=${color}:s=${file.width}x${file.height},format=rgba" \
                    -filter_complex "[0:v][1:v]blend=all_mode=overlay:all_opacity=${a / 255}" \
                    -preset ${args.encodingPreset} -y "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -f lavfi -i "color=${color}:s=${file.width}x${file.height},format=rgba" \
                    -filter_complex "[0:v][1:v]blend=all_mode=overlay:all_opacity=${a / 255}" \
                    -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p -y "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -f lavfi -i "color=${color}:s=${file.width}x${file.height},format=rgba" \
                    -filter_complex "[0:v][1:v]blend=all_mode=overlay:all_opacity=${a / 255},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                    -preset ${args.encodingPreset} -gifflags -offsetting -y "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};