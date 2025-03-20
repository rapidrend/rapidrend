const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.bouncy.name"),
    description: translate("commands.bouncy.description"),
    category: translate("categories.animation"),
    args: {
        input: {
            name: translate("commands.bouncy.args.input.name"),
            desc: translate("commands.bouncy.args.input.desc"),
            type: "file",
            required: true,

            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;

        const { path } = file;

        let tempPath = makeTempPath("gif");

        await execPromise(`ffmpeg -stream_loop -1 -t 0.25 -i "${path}" \
            -r 50 -stream_loop -1 -t 0.25 -i assets/image/transparent.png \
            -filter_complex "[0:v]fps=50,scale=100:100:force_original_aspect_ratio=decrease[overlay];\
            [1:v]scale=300:300[transparent];[transparent][overlay]overlay=x=((W-w)/2)-cos(PI/2*(t*8))*100:y=((H-h)/2)-sin(PI/2*(t*8))*100:format=auto[overlayed];\
            [overlayed]split[normal][reverse];[reverse]reverse[reversed];[normal][reversed]concat,crop=300:200:0:0,split[pout][ppout];\
            [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" -map "[out]" \
            -preset ${args.encodingPreset} -gifflags -offsetting -r 50 -t 0.5 -y "${tempPath}"`);

        return new FileEmbed(tempPath);
    }
}