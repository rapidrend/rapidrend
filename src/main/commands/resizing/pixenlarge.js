const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.pixenlarge.name"),
    description: translate("commands.pixenlarge.description"),
    category: translate("categories.resizing"),
    args: require("#args/commands/resizing/pixenlarge"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { multiplier, filter } = args;

        const { path, shortType } = file;

        let tempPath;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${path}" -filter_complex \
                    "[0:v]alphaextract,${filter}=${multiplier}[mask];\
                    [0:v]${filter}=${multiplier}[input];\
                    [input][mask]alphamerge[out]" \
                    -map "[out]" -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -map 0:a? -filter_complex \
                    "[0:v]${filter}=${multiplier},scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -filter_complex \
                    "[0:v]alphaextract,${filter}=${multiplier}[mask];\
                    [0:v]${filter}=${multiplier}[input];\
                    [input][mask]alphamerge,split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];\
                    [pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};