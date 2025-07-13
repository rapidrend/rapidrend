const { execPromise } = require("#functions/media");
const { makeTempPath, getAsset } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.circle.name"),
    description: translate("commands.circle.description"),
    category: translate("categories.animation"),
    args: require("#args/commands/animation/circle"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { width, height, fileWidth, fileHeight, duration } = args;

        const { path: filePath, type: { ext } } = file;

        let tempPath = makeTempPath("gif");

        await execPromise(`ffmpeg -stream_loop -1 -t ${duration} ${ext === "jpg" ? "-f image2 " : ""}-i "${filePath}" \
            -r 50 -stream_loop -1 -t ${duration} -i "${getAsset("image", "transparent")}" \
            -filter_complex "[0:v]fps=50,scale=${fileWidth}:${fileHeight}:force_original_aspect_ratio=decrease[overlay];[1:v]scale=${width}:${height}[transparent];\
            [transparent][overlay]overlay=x=((W-w)/2)-cos(PI/2*(t*4/${duration}))*${(width / 2) - (fileWidth / 2)}:y=((H-h)/2)-sin(PI/2*(t*4/${duration}))*${(height / 2) - (fileHeight / 2)}:format=auto,split[pout][ppout];\
            [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
            -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting -r 50 -t ${duration} "${tempPath}"`);

        return new FileEmbed(tempPath);
    }
}