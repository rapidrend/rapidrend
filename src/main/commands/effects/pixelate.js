const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.pixelate.name"),
    description: translate("commands.pixelate.description"),
    category: translate("categories.effects"),
    args: {
        input: {
            name: translate("commands.pixelate.args.input.name"),
            desc: translate("commands.pixelate.args.input.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        size: {
            name: translate("commands.pixelate.args.size.name"),
            desc: translate("commands.pixelate.args.size.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 2,
                min: 1,
                max: 100,
                round: true
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { size } = args;
        
        const { path, shortType } = file;
        let tempPath;

        const pixelateFilter = `scale=iw/${size}:ih/${size}:flags=neighbor,scale=iw*${size}:ih*${size}:flags=neighbor`;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:v]${pixelateFilter}[out]" -map "[out]" \
                    -preset ${args.encodingPreset} -y "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -map 0:a? -b:a 10k -filter_complex "[0:v]${pixelateFilter},scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p -y "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:v]${pixelateFilter},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting -y "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};