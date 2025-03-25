const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.alphaextract.name"),
    description: translate("commands.alphaextract.description"),
    category: translate("categories.effects"),
    args: {
        input: {
            name: translate("commands.alphaextract.args.input.name"),
            desc: translate("commands.alphaextract.args.input.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif"]
                }
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { path: filePath, shortType } = file;

        let tempPath;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${filePath}" -filter_complex "[0:v]alphaextract[out]" -map "[out]" \
                    -preset ${args.encodingPreset} -y "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${filePath}" -filter_complex "[0:v]alphaextract,split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting -y "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};