const path = require("path");

const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.infinity.name"),
    description: translate("commands.infinity.description"),
    category: translate("categories.animation"),
    args: {
        input: {
            name: translate("commands.infinity.args.input.name"),
            desc: translate("commands.infinity.args.input.desc"),
            type: "file",
            required: true,

            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },

        width: {
            name: translate("commands.infinity.args.width.name"),
            desc: translate("commands.infinity.args.width.desc"),
            type: "number",
            required: false,

            settings: {
                dft: 300,

                min: 1,
                max: 1000,
            }
        },

        height: {
            name: translate("commands.infinity.args.height.name"),
            desc: translate("commands.infinity.args.height.desc"),
            type: "number",
            required: false,

            settings: {
                dft: 300,

                min: 1,
                max: 1000,
            }
        },

        fileWidth: {
            name: translate("commands.infinity.args.fileWidth.name"),
            desc: translate("commands.infinity.args.fileWidth.desc"),
            type: "pixels",
            required: false,

            settings: {
                dft: 100,

                min: 1,
                max: 1000,
                base: (argJSON) => argJSON.width
            }
        },

        fileHeight: {
            name: translate("commands.infinity.args.fileHeight.name"),
            desc: translate("commands.infinity.args.fileHeight.desc"),
            type: "pixels",
            required: false,

            settings: {
                dft: 100,

                min: 1,
                max: 1000,
                base: (argJSON) => argJSON.height
            }
        },

        duration: {
            name: translate("commands.infinity.args.duration.name"),
            desc: translate("commands.infinity.args.duration.desc"),
            type: "number",
            required: false,

            settings: {
                dft: 2,

                min: 0.05,
                max: 10,
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { width, height, fileWidth, fileHeight, duration } = args;

        const { path: filePath } = file;

        let tempPath = makeTempPath("gif");

        await execPromise(`ffmpeg -stream_loop -1 -t ${duration} -i "${filePath}" \
            -r 50 -stream_loop -1 -t ${duration} -i ${path.join(appPath, "assets", "image", "transparent.png")} \
            -filter_complex "[0:v]fps=50,scale=${fileWidth}:${fileHeight}:force_original_aspect_ratio=decrease[overlay];[1:v]scale=${width}:${height}[transparent];\
            [transparent][overlay]overlay=x=((W-w)/2)-cos(PI/2*(t*4/${duration}))*${(width / 2) - (fileWidth / 2)}:y=((H-h)/2)-sin(PI*(t*4/${duration}))*${(height / 2) - (fileHeight / 2)}:format=auto,split[pout][ppout];\
            [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
            -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting -r 50 -t ${duration} -y "${tempPath}"`);

        return new FileEmbed(tempPath);
    }
}