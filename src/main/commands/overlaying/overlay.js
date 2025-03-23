const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.overlay.name"),
    description: translate("commands.overlay.description"),
    category: translate("categories.overlaying"),
    args: {
        baseFile: {
            name: translate("commands.overlay.args.baseFile.name"),
            desc: translate("commands.overlay.args.baseFile.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        overlayFile: {
            name: translate("commands.overlay.args.overlayFile.name"),
            desc: translate("commands.overlay.args.overlayFile.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        x: {
            name: translate("commands.overlay.args.x.name"),
            desc: translate("commands.overlay.args.x.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 0
            }
        },
        y: {
            name: translate("commands.overlay.args.y.name"),
            desc: translate("commands.overlay.args.y.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 0
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const baseFile = args.baseFile;
        const overlayFile = args.overlayFile;
        const { x, y } = args;

        const { path: basePath, shortType: baseType } = baseFile;
        const { path: overlayPath } = overlayFile;

        let tempPath;

        switch (baseType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${basePath}" -i "${overlayPath}" \
                    -filter_complex "[1:v]scale=iw:ih[overlay];[0:v][overlay]overlay=${x}:${y}" \
                    -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${basePath}" -i "${overlayPath}" \
                    -filter_complex "[1:v]scale=iw:ih[overlay];[0:v][overlay]overlay=${x}:${y}" \
                    -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${basePath}" -i "${overlayPath}" \
                    -filter_complex "[1:v]scale=iw:ih[overlay];[0:v][overlay]overlay=${x}:${y},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                    -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};