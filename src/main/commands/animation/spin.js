const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.spin.name"),
    description: translate("commands.spin.description"),
    category: translate("categories.animation"),
    args: {
        input: {
            name: translate("commands.spin.args.input.name"),
            desc: translate("commands.spin.args.input.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        duration: {
            name: translate("commands.spin.args.duration.name"),
            desc: translate("commands.spin.args.duration.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 1,
                min: 0.1,
                max: 10
            }
        },
        size: {
            name: translate("commands.spin.args.size.name"),
            desc: translate("commands.spin.args.size.desc"),
            type: "pixels",
            required: false,
            settings: {
                dft: 400,
                min: 10,
                max: 1000
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { duration, size } = args;

        const { path: filePath } = file;

        let tempPath = makeTempPath("gif");

        await execPromise(`ffmpeg -r 50 -stream_loop -1 -t ${duration} -i "${filePath}" \
            -filter_complex "[0:v]scale='min(${size},iw)':min'(${size},ih)':force_original_aspect_ratio=decrease,rotate=t/${duration}*360*PI/180:ow='max(iw,ih)':oh=max'(iw,ih)':c=0x00000000,split[pout][ppout];\
            [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
            -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting -r 50 -t ${duration} -y "${tempPath}"`);

        return new FileEmbed(tempPath);
    }
};