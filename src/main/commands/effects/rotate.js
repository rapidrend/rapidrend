const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.rotate.name"),
    description: translate("commands.rotate.description"),
    category: translate("categories.effects"),
    args: require("#args/commands/effects/rotate"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const { degrees, input, cut } = args;
        const { path, shortType } = input;
        let tempPath;

        const radians = degrees * Math.PI / 180;
        const dimensions = cut ? "" : `:ow=rotw(${radians}):oh=roth(${radians})`;

        const rotateFilter = `rotate=${radians}${dimensions}:c=0x00000000`;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:v]${rotateFilter}[out]" -map "[out]" \
                    -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -map 0:a? -filter_complex "[0:v]${rotateFilter},scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:v]${rotateFilter},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};