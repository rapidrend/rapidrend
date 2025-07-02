const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");
const { parseNumber } = require("#functions/arguments");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.crop.name"),
    description: translate("commands.crop.description"),
    category: translate("categories.resizing"),
    args: require("#args/commands/resizing/crop"),
    globalArgs: ["encodingPreset"],
    editors: ["crop"],
    execute: async function (args) {
        const file = args.input;
        let { x, y, width: w, height: h } = args;

        const { path, shortType, width, height } = file;

        let tempPath;
        
        w = parseNumber(w, { min: 1, max: width - x, dft: width });
        h = parseNumber(h, { min: 1, max: height - y, dft: height });

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${path}" -vf "crop=${w}:${h}:${x}:${y}" \
                    -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -vf "crop=${w}:${h}:${x}:${y},scale=ceil(iw/2)*2:ceil(ih/2)*2" \
                    -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -vf "crop=${w}:${h}:${x}:${y},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                    -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};