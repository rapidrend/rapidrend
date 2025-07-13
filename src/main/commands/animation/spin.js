const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.spin.name"),
    description: translate("commands.spin.description"),
    category: translate("categories.animation"),
    args: require("#args/commands/animation/spin"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { duration, cut } = args;

        const { path: filePath, type: { ext } } = file;

        const dimensions = cut ? "" : `:ow='hypot(iw,ih)':oh=ow`;

        let tempPath = makeTempPath("gif");

        await execPromise(`ffmpeg -r 50 -stream_loop -1 -t ${duration} ${ext === "jpg" ? "-f image2 " : ""}-i "${filePath}" \
            -filter_complex "[0:v]rotate=t/${duration}*360*PI/180${dimensions}:c=0x00000000,split[pout][ppout];\
            [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
            -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting -r 50 -t ${duration} "${tempPath}"`);

        return new FileEmbed(tempPath);
    }
};