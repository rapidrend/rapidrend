const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.stack.name"),
    description: translate("commands.stack.description"),
    category: translate("categories.overlaying"),
    args: {
        input: {
            name: translate("commands.stack.args.input.name"),
            desc: translate("commands.stack.args.input.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        count: {
            name: translate("commands.stack.args.count.name"),
            desc: translate("commands.stack.args.count.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 1,
                min: 1,
                max: 10,
                round: true
            }
        },
        direction: {
            name: translate("commands.stack.args.direction.name"),
            desc: translate("commands.stack.args.direction.desc"),
            type: "string",
            required: false,
            settings: {
                allowed: ["horizontal", "vertical"],
                dft: "horizontal"
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { count, direction } = args;
        const { path, shortType, width, height } = file;

        let tempPath;
        const stackFilter = direction === "horizontal" ? 
            `hstack=inputs=${count + 1}` : 
            `vstack=inputs=${count + 1}`;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:v]${'[0:v]'.repeat(count)}${stackFilter}[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -y "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                const aspect = direction === "horizontal" ? 
                    `${width * (count + 1)}:${height}` : 
                    `${width}:${height * (count + 1)}`;
                
                await execPromise(`ffmpeg -i "${path}" -map 0:a? -filter_complex \
                    "[0:v]${'[0:v]'.repeat(count)}${stackFilter}[oout];[oout]scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -aspect ${aspect} -c:v libx264 -pix_fmt yuv420p -y "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -filter_complex \
                    "[0:v]${'[0:v]'.repeat(count)}${stackFilter}[oout];[oout]split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting -y "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
}; 
