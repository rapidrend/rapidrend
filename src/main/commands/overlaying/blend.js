const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.blend.name"),
    description: translate("commands.blend.description"),
    category: translate("categories.overlaying"),
    args: require("#args/commands/overlaying/blend"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const baseFile = args.base;
        const blendFile = args.blend;
        const mode = args.mode.toLowerCase();

        const { path: basePath, shortType: baseType } = baseFile;
        const { path: blendPath } = blendFile;

        let tempPath;

        switch (baseType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${basePath}" -i "${blendPath}" \
                    -filter_complex "[1:v]scale=iw:ih[blend];[0:v][blend]blend=all_mode=${mode}" \
                    -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${basePath}" -i "${blendPath}" \
                    -filter_complex "[1:v]scale=iw:ih[blend];[0:v][blend]blend=all_mode=${mode}" \
                    -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${basePath}" -i "${blendPath}" \
                    -filter_complex "[1:v]scale=iw:ih[blend];[0:v][blend]blend=all_mode=${mode},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                    -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};