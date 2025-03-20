const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.blend.name"),
    description: translate("commands.blend.description"),
    category: translate("categories.overlaying"),
    args: {
        input1: {
            name: translate("commands.blend.args.input1.name"),
            desc: translate("commands.blend.args.input1.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        input2: {
            name: translate("commands.blend.args.input2.name"),
            desc: translate("commands.blend.args.input2.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        mode: {
            name: translate("commands.blend.args.mode.name"),
            desc: translate("commands.blend.args.mode.desc"),
            type: "string",
            required: false,
            settings: {
                allowed: [
                    'addition', 'grainmerge', 'and', 'average', 'burn', 'bleach',
                    'darken', 'difference', 'grainextract', 'divide', 'dodge', 'freeze',
                    'exclusion', 'extremity', 'geometric', 'glow', 'hardlight', 'hardoverlay',
                    'harmonic', 'interpolate', 'hardmix', 'heat', 'lighten', 'linearlight',
                    'multiply', 'multiply128', 'negation', 'normal', 'or', 'overlay',
                    'phoenix', 'pinlight', 'reflect', 'screen', 'stain', 'softlight',
                    'softdifference', 'subtract', 'vividlight', 'xor'
                ],
                dft: 'addition'
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const baseFile = args.input1;
        const blendFile = args.input2;
        const mode = args.mode;

        const { path: basePath, shortType: baseType } = baseFile;
        const { path: blendPath } = blendFile;

        let tempPath;

        switch (baseType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${basePath}" -i "${blendPath}" \
                    -filter_complex "[1:v]scale=iw:ih[blend];[0:v][blend]blend=all_mode=${mode}" \
                    -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${basePath}" -i "${blendPath}" \
                    -filter_complex "[1:v]scale=iw:ih[blend];[0:v][blend]blend=all_mode=${mode}" \
                    -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${basePath}" -i "${blendPath}" \
                    -filter_complex "[1:v]scale=iw:ih[blend];[0:v][blend]blend=all_mode=${mode},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                    -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};