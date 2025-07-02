const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.shrink.name"),
    description: translate("commands.shrink.description"),
    category: translate("categories.resizing"),
    args: require("#args/commands/resizing/shrink"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { multiplier, direction, scaleAlgorithm } = args;

        const { path, shortType } = file;

        let tempPath;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${path}" -vf "scale=iw${direction == "vertical" ? "" : `/${multiplier}`}:\
                    ih${direction == "horizontal" ? "" : `/${multiplier}`}:flags=${scaleAlgorithm}" \
                    -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -vf "scale=iw${direction == "vertical" ? "" : `/${multiplier}`}:\
                    ih${direction == "horizontal" ? "" : `/${multiplier}`}:flags=${scaleAlgorithm},scale=ceil(iw/2)*2:ceil(ih/2)*2:flags=${scaleAlgorithm}" \
                    -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -vf "scale=iw${direction == "vertical" ? "" : `/${multiplier}`}:\
                    ih${direction == "horizontal" ? "" : `/${multiplier}`}:flags=${scaleAlgorithm},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                    -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};