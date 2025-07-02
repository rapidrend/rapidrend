const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.blur.name"),
    description: translate("commands.blur.description"),
    category: translate("categories.effects"),
    args: require("#args/commands/effects/blur"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { radius, power } = args;
        
        const { path, shortType } = file;
        let tempPath;

        const blurParams = `luma_radius=${radius}:luma_power=${power}:chroma_radius=${radius}:chroma_power=${power}:alpha_radius=${radius}:alpha_power=${power}`;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:v]boxblur=${blurParams}[out]" -map "[out]" -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -map 0:a? -b:a 10k -filter_complex "[0:v]boxblur=${blurParams},scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" -map "[out]" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:v]boxblur=${blurParams},split[pout][ppout];[ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};