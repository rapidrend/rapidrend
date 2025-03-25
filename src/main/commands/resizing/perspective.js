const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.perspective.name"),
    description: translate("commands.perspective.description"),
    category: translate("categories.resizing"),
    args: {
        input: {
            name: translate("commands.perspective.args.input.name"),
            desc: translate("commands.perspective.args.input.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        tlX: {
            name: translate("commands.perspective.args.tlX.name"),
            desc: translate("commands.perspective.args.tlX.desc"),
            type: "pixels",
            required: false,
            settings: {
                dft: 0,
                min: 0,
                max: (args) => args.input?.width
            }
        },
        tlY: {
            name: translate("commands.perspective.args.tlY.name"),
            desc: translate("commands.perspective.args.tlY.desc"),
            type: "pixels",
            required: false,
            settings: {
                dft: 0,
                min: 0,
                max: (args) => args.input?.height
            }
        },
        trX: {
            name: translate("commands.perspective.args.trX.name"),
            desc: translate("commands.perspective.args.trX.desc"),
            type: "pixels",
            required: false,
            settings: {
                dft: (args) => args.input?.width,
                min: 0,
                max: (args) => args.input?.width
            }
        },
        trY: {
            name: translate("commands.perspective.args.trY.name"),
            desc: translate("commands.perspective.args.trY.desc"),
            type: "pixels",
            required: false,
            settings: {
                dft: 0,
                min: 0,
                max: (args) => args.input?.height
            }
        },
        blX: {
            name: translate("commands.perspective.args.blX.name"),
            desc: translate("commands.perspective.args.blX.desc"),
            type: "pixels",
            required: false,
            settings: {
                dft: 0,
                min: 0,
                max: (args) => args.input?.width
            }
        },
        blY: {
            name: translate("commands.perspective.args.blY.name"),
            desc: translate("commands.perspective.args.blY.desc"),
            type: "pixels",
            required: false,
            settings: {
                dft: (args) => args.input?.height,
                min: 0,
                max: (args) => args.input?.height
            }
        },
        brX: {
            name: translate("commands.perspective.args.brX.name"),
            desc: translate("commands.perspective.args.brX.desc"),
            type: "pixels",
            required: false,
            settings: {
                dft: (args) => args.input?.width,
                min: 0,
                max: (args) => args.input?.width
            }
        },
        brY: {
            name: translate("commands.perspective.args.brY.name"),
            desc: translate("commands.perspective.args.brY.desc"),
            type: "pixels",
            required: false,
            settings: {
                dft: (args) => args.input?.height,
                min: 0,
                max: (args) => args.input?.height
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { path, shortType, width, height } = file;
        
        // Get all perspective points with defaults
        const tlX = args.tlX ?? 0;
        const tlY = args.tlY ?? 0;
        const trX = args.trX ?? width;
        const trY = args.trY ?? 0;
        const blX = args.blX ?? 0;
        const blY = args.blY ?? height;
        const brX = args.brX ?? width;
        const brY = args.brY ?? height;

        let tempPath;

        const perspectiveFilter = `perspective=${tlX}:${tlY}:${trX}:${trY}:${blX}:${blY}:${brX}:${brY}`;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("png");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "${perspectiveFilter}" \
                    -preset ${args.encodingPreset} -y "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "${perspectiveFilter},scale=ceil(iw/2)*2:ceil(ih/2)*2" \
                    -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p -y "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "${perspectiveFilter},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                    -preset ${args.encodingPreset} -gifflags -offsetting -y "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
}; 
