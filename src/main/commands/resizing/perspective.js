const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.perspective.name"),
    description: translate("commands.perspective.description"),
    category: translate("categories.resizing"),
    args: require("#args/commands/resizing/perspective"),
    globalArgs: ["encodingPreset"],
    editors: ["perspective"],
    execute: async function (args) {
        const { input: file, stretch, interpolation } = args;
        const { path, shortType, width, height } = file;

        const tlX = args.tlX ?? 0;
        const tlY = args.tlY ?? 0;
        const trX = args.trX ?? width;
        const trY = args.trY ?? 0;
        const blX = args.blX ?? 0;
        const blY = args.blY ?? height;
        const brX = args.brX ?? width;
        const brY = args.brY ?? height;

        let tempPath;

        const perspectiveFilter = `${!stretch ? "pad=iw+2:ih+2:1:1:color=0x00000000," : ""}perspective=${tlX}:${tlY}:${trX}:${trY}:${blX}:${blY}:${brX}:${brY}:sense=destination:interpolation=${interpolation}${!stretch ? ",crop=iw-2:ih-2:1:1" : ""}`;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "${perspectiveFilter}" \
                    -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "${perspectiveFilter},scale=ceil(iw/2)*2:ceil(ih/2)*2" \
                    -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "${perspectiveFilter},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                    -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};