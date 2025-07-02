const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.cropratio.name"),
    description: translate("commands.cropratio.description"),
    category: translate("categories.resizing"),
    args: require("#args/commands/resizing/cropratio"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { ratioW, ratioH, originX, originY } = args;

        const { path, shortType, width, height } = file;

        let cropWidth, cropHeight;
        const imageRatio = width / height;
        const targetRatio = ratioW / ratioH;

        if (imageRatio > targetRatio) {
            cropHeight = height;
            cropWidth = Math.round(height * targetRatio);
        } else {
            cropWidth = width;
            cropHeight = Math.round(width / targetRatio);
        }

        let x, y;
        switch (originX) {
            case "left":
                x = 0;
                break;
            case "right":
                x = width - cropWidth;
                break;
            default:
                x = Math.round((width - cropWidth) / 2);
        }

        switch (originY) {
            case "top":
                y = 0;
                break;
            case "bottom":
                y = height - cropHeight;
                break;
            default:
                y = Math.round((height - cropHeight) / 2);
        }

        let tempPath;
        
        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${path}" -vf "crop=${cropWidth}:${cropHeight}:${x}:${y}" \
                    -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -vf "crop=${cropWidth}:${cropHeight}:${x}:${y},scale=ceil(iw/2)*2:ceil(ih/2)*2" \
                    -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -vf "crop=${cropWidth}:${cropHeight}:${x}:${y},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                    -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};