const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.overlay.name"),
    description: translate("commands.overlay.description"),
    category: translate("categories.overlaying"),
    args: {
        base: {
            name: translate("commands.overlay.args.base.name"),
            desc: translate("commands.overlay.args.base.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        overlay: {
            name: translate("commands.overlay.args.overlay.name"),
            desc: translate("commands.overlay.args.overlay.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        originX: {
            name: translate("commands.overlay.args.originX.name"),
            desc: translate("commands.overlay.args.originX.desc"),
            type: "string",
            required: false,
            settings: {
                allowed: ["left", "center", "right"],
                dft: "center"
            }
        },
        originY: {
            name: translate("commands.overlay.args.originY.name"),
            desc: translate("commands.overlay.args.originY.desc"),
            type: "string",
            required: false,
            settings: {
                allowed: ["top", "middle", "bottom"],
                dft: "middle"
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
        },
        w: {
            name: translate("commands.overlay.args.w.name"),
            desc: translate("commands.overlay.args.w.desc"),
            type: "pixels",
            required: false,
            settings: {
                min: 1,
                max: 3000,
                base: (args) => args.overlay?.width
            }
        },
        h: {
            name: translate("commands.overlay.args.h.name"),
            desc: translate("commands.overlay.args.h.desc"),
            type: "pixels",
            required: false,
            settings: {
                min: 1,
                max: 3000,
                base: (args) => args.overlay?.height
            }
        },
        keepAspectRatio: {
            name: translate("commands.overlay.args.keepAspectRatio.name"),
            desc: translate("commands.overlay.args.keepAspectRatio.desc"),
            type: "string",
            required: false,
            settings: {
                allowed: ["increase", "decrease"],
                dft: "decrease"
            }
        },
        start: {
            name: translate("commands.overlay.args.start.name"),
            desc: translate("commands.overlay.args.start.desc"),
            type: "timestamp",
            required: false,
            settings: {
                dft: 0,
                max: (args) => Math.min(args.base?.duration || Infinity, args.overlay?.duration || Infinity)
            }
        },
        end: {
            name: translate("commands.overlay.args.end.name"),
            desc: translate("commands.overlay.args.end.desc"),
            type: "timestamp",
            required: false,
            settings: {
                dft: (args) => Math.min(args.base?.duration || Infinity, args.overlay?.duration || Infinity),
                max: (args) => Math.min(args.base?.duration || Infinity, args.overlay?.duration || Infinity)
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const base = args.base;
        const overlay = args.overlay;
        const {
            originX,
            originY,
            x: offsetX,
            y: offsetY,
            w: width,
            h: height,
            keepAspectRatio,
            start,
            end
        } = args;

        const { path: basePath, shortType: baseType } = base;
        const { path: overlayPath, shortType: overlayType } = overlay;

        const origins = {
            x: {
                left: '0',
                center: '(W-w)/2',
                right: '(W-w)'
            },
            y: {
                top: '0',
                middle: '(H-h)/2',
                bottom: '(H-h)'
            }
        };

        const originXExpr = origins.x[originX] || '(W-w)/2';
        const originYExpr = origins.y[originY] || '(H-h)/2';

        const sizeFilter = `scale=${width || -1}:${height || -1}${keepAspectRatio ? `:force_original_aspect_ratio=${keepAspectRatio}` : ''}`;
        const timeFilter = start || end ? `:enable='between(t,${start},${end})'` : '';

        let tempPath;

        switch (baseType) {
            case "image":
                if (overlayType === "image") {
                    tempPath = makeTempPath("png");
                    await execPromise(`ffmpeg -i "${basePath}" -i "${overlayPath}" \
                        -filter_complex "[1:v]${sizeFilter}[overlay];[0:v][overlay]overlay=x=${originXExpr}+${Math.round(offsetX)}:y=${originYExpr}+${Math.round(offsetY)}:format=auto[out]" \
                        -map "[out]" -preset ${args.encodingPreset} -y "${tempPath}"`);
                } else {
                    tempPath = makeTempPath("gif");
                    await execPromise(`ffmpeg -stream_loop -1 -i "${basePath}" -i "${overlayPath}" \
                        -filter_complex "[1:v]${sizeFilter}[overlay];[0:v][overlay]overlay=shortest=1:x=${originXExpr}+${Math.round(offsetX)}:y=${originYExpr}+${Math.round(offsetY)}:format=auto${timeFilter},split[gnout][gpout];[gpout]palettegen=reserve_transparent=1[palette];[gnout][palette]paletteuse=alpha_threshold=128[out]" \
                        -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting -y "${tempPath}"`);
                }
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg ${overlayType === "video" ? "" : "-stream_loop -1"} -i "${basePath}" \
                    ${baseType === "video" ? "" : "-stream_loop -1"} -i "${overlayPath}" \
                    -map ${baseType === "video" ? '0' : '1'}:a? \
                    -filter_complex "[1:v]${sizeFilter}[overlay];[0:v][overlay]overlay=shortest=1:x=${originXExpr}+${Math.round(offsetX)}:y=${originYExpr}+${Math.round(offsetY)}:format=auto${timeFilter},scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p -y "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -stream_loop -1 -i "${basePath}" -i "${overlayPath}" \
                    -filter_complex "[1:v]${sizeFilter}[overlay];[0:v][overlay]overlay=shortest=1:x=${originXExpr}+${Math.round(offsetX)}:y=${originYExpr}+${Math.round(offsetY)}:format=auto${timeFilter},split[gnout][gpout];[gpout]palettegen=reserve_transparent=1[palette];[gnout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting -y "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};