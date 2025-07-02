const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.pseudocolor.name"),
    description: translate("commands.pseudocolor.description"),
    category: translate("categories.color"),
    args: require("#args/commands/color/pseudocolor"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const preset = args.preset;

        const { path: filePath, shortType } = file;

        let tempPath;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${filePath}" -filter_complex "[0:v]pseudocolor=preset=${preset}[out]" \
                    -map "[out]" -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${filePath}" -map 0:a? -filter_complex "[0:v]pseudocolor=preset=${preset},\
                    scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" -map "[out]" \
                    -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${filePath}" -filter_complex "[0:v]pseudocolor=preset=${preset},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" -map "[out]" \
                    -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};