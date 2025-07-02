const { execPromise } = require("#functions/media");
const { makeTempPath, getAsset } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.zoomin.name"),
    description: translate("commands.zoomin.description"),
    category: translate("categories.resizing"),
    args: require("#args/commands/resizing/zoomin"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { multiplier, direction, originX, originY, scaleAlgorithm } = args;

        const { path, shortType } = file;

        const origins = {
            x: {
                left: '0',
                center: '(W-w)/2',
                right: '(W-w)'
            },
            y: {
                top: '0',
                middle: '(H-h)/2',
                bottom: '(H-h)'
            }
        };

        const originx = origins.x[originX] || '(W-w)/2';
        const originy = origins.y[originY] || '(H-h)/2';

        let tempPath;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${path}" -i "${getAsset("image", "transparent")}" -filter_complex \
                    "[1:v][0:v]scale2ref[background][input];\
                    [input]scale=iw${direction == "vertical" ? "" : `*${multiplier}`}:ih${direction == "horizontal" ? "" : `*${multiplier}`}:flags=${scaleAlgorithm}[overlay];\
                    [background][overlay]overlay=x=${originx}:y=${originy}:format=auto[out]" \
                    -map "[out]" -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -i "${getAsset("image", "transparent")}" -map 0:a? -filter_complex \
                    "[1:v][0:v]scale2ref[background][input];\
                    [input]scale=iw${direction == "vertical" ? "" : `*${multiplier}`}:ih${direction == "horizontal" ? "" : `*${multiplier}`}:flags=${scaleAlgorithm}[overlay];\
                    [background][overlay]overlay=x=${originx}:y=${originy}:format=auto,scale=ceil(iw/2)*2:ceil(ih/2)*2:flags=${scaleAlgorithm}[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -i "${getAsset("image", "transparent")}" -filter_complex \
                    "[1:v][0:v]scale2ref[background][input];\
                    [input]scale=iw${direction == "vertical" ? "" : `*${multiplier}`}:ih${direction == "horizontal" ? "" : `*${multiplier}`}:flags=${scaleAlgorithm}[overlay];\
                    [background][overlay]overlay=x=${originx}:y=${originy}:format=auto,split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};