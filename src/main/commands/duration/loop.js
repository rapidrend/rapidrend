const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.loop.name"),
    description: translate("commands.loop.description"),
    category: translate("categories.duration"),
    args: require("#args/commands/duration/loop"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const times = args.times;
        const { path: filePath, shortType } = file;

        let tempPath;

        switch (shortType) {
            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -stream_loop ${times - 1} -i "${filePath}" \
                    -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -stream_loop ${times - 1} -i "${filePath}" \
                    -filter_complex "split[pout][ppout];[ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;

            case "audio":
                tempPath = makeTempPath("mp3");
                await execPromise(`ffmpeg -stream_loop ${times - 1} -i "${filePath}" \
                    -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -stream_loop ${times - 1} -i "${filePath}" \
                    -filter_complex "tile=${times}x1" -frames:v 1 "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
}; 
