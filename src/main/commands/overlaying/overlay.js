const { execPromise, highestFps } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.overlay.name"),
    description: translate("commands.overlay.description"),
    category: translate("categories.overlaying"),
    args: require("#args/commands/overlaying/overlay"),
    globalArgs: ["encodingPreset"],
    editors: ["overlay"],
    execute: async function (args) {
        const base = args.base;
        const overlay = args.overlay;
        const {
            originX,
            originY,
            x: offsetX,
            y: offsetY,
            width,
            height,
            keepAspectRatio,
            start,
            end
        } = args;

        const { path: basePath, shortType: baseType, type: { ext: baseExt }, fps: baseFps } = base;
        const { path: overlayPath, shortType: overlayType, type: { ext: overlayExt }, fps: overlayFps } = overlay;

        const origins = {
            x: {
                left: "0",
                center: "(W-w)/2",
                right: "(W-w)"
            },
            y: {
                top: "0",
                middle: "(H-h)/2",
                bottom: "(H-h)"
            }
        };

        const originXExpr = origins.x[originX] || "(W-w)/2";
        const originYExpr = origins.y[originY] || "(H-h)/2";

        const sizeFilter = `scale=${width || -1}:${height || -1}${keepAspectRatio != "no" ? `:force_original_aspect_ratio=${keepAspectRatio}` : ""}`;
        const timeFilter = start || end ? `:enable='between(t,${start},${end})'` : "";

        let tempPath;

        switch (baseType) {
            case "image":
                if (overlayType === "image") {
                    tempPath = makeTempPath("png");
                    await execPromise(`ffmpeg -i "${basePath}" -i "${overlayPath}" \
                        -filter_complex "[1:v]${sizeFilter}[overlay];[0:v][overlay]overlay=x=${originXExpr}+${Math.round(offsetX)}:y=${originYExpr}+${Math.round(offsetY)}:format=auto[out]" \
                        -map "[out]" -preset ${args.encodingPreset} "${tempPath}"`);
                } else {
                    tempPath = makeTempPath("gif");
                    await execPromise(`ffmpeg -stream_loop -1 -r ${overlayFps} ${baseExt === "jpg" ? "-f image2 " : ""}-i "${basePath}" \
                        -r ${overlayFps} -ss ${start} -t ${end - start} -i "${overlayPath}" \
                        -filter_complex "[1:v]${sizeFilter}[overlay];[0:v][overlay]overlay=shortest=1:x=${originXExpr}+${Math.round(offsetX)}:y=${originYExpr}+${Math.round(offsetY)}:format=auto${timeFilter},split[gnout][gpout];[gpout]palettegen=reserve_transparent=1[palette];[gnout][palette]paletteuse=alpha_threshold=128[out]" \
                        -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                }
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg ${overlayType === "video" && baseType !== "video" ? "-stream_loop -1 " : ""}${baseExt === "jpg" ? "-f image2 " : ""}-i "${basePath}" \
                    ${baseType === "video" && overlayType !== "video" ? "-stream_loop -1 " : ""}${overlayExt === "jpg" ? "-f image2 " : ""}-ss ${start} -t ${end - start} -i "${overlayPath}" \
                    -map ${baseType === "video" ? "0" : "1"}:a? \
                    -filter_complex "[1:v]${sizeFilter}[overlay];[0:v][overlay]overlay=shortest=1:x=${originXExpr}+${Math.round(offsetX)}:y=${originYExpr}+${Math.round(offsetY)}:format=auto${timeFilter},scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg ${overlayType === "image" ? "" : "-stream_loop -1 "}-r ${highestFps(baseFps, overlayFps)} -i "${basePath}" \
                    ${overlayType === "image" ? "-stream_loop -1 " : ""}-r ${highestFps(baseFps, overlayFps)} ${overlayExt === "jpg" ? "-f image2 " : ""}-ss ${start} -t ${end - start} -i "${overlayPath}" \
                    -filter_complex "[1:v]${sizeFilter}[overlay];[0:v][overlay]overlay=shortest=1:x=${originXExpr}+${Math.round(offsetX)}:y=${originYExpr}+${Math.round(offsetY)}:format=auto${timeFilter},split[gnout][gpout];[gpout]palettegen=reserve_transparent=1[palette];[gnout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};