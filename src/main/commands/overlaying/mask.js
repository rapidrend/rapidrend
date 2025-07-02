const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.mask.name"),
    description: translate("commands.mask.description"),
    category: translate("categories.overlaying"),
    args: require("#args/commands/overlaying/mask"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const base = args.base;
        const mask = args.mask;
        const {
            keep,
            originX,
            originY,
            x: offsetX,
            y: offsetY,
            width,
            height,
            keepAspectRatio
        } = args;

        const { path: basePath, shortType: baseType, width: baseWidth, height: baseHeight } = base;
        const { path: maskPath, shortType: maskType } = mask;

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

        let tempPath;
        const sizeFilter = `scale=${width || -1}:${height || -1}${keepAspectRatio != "no" ? `:force_original_aspect_ratio=${keepAspectRatio}` : ""}`;

        switch (baseType) {
            case "image":
                if (maskType === "image") {
                    tempPath = makeTempPath("png");
                    await execPromise(`ffmpeg -i "${basePath}" -i "${maskPath}" \
                        -f lavfi -i "color=0x${keep ? "FFFFFF" : "000000"}FF:s=${baseWidth}x${baseHeight},format=rgba" \
                        -filter_complex "[1:v]${sizeFilter},hue=s=0[overlay];[2:v][overlay]overlay=x=${originXExpr}+${Math.round(offsetX)}:y=${originYExpr}+${Math.round(offsetY)}:format=auto[mask];[0:v][mask]alphamerge[out]" \
                        -map "[out]" -preset ${args.encodingPreset} "${tempPath}"`);
                } else {
                    tempPath = makeTempPath("gif");
                    await execPromise(`ffmpeg -stream_loop -1 -i "${basePath}" -i "${maskPath}" \
                        -f lavfi -i "color=0x${keep ? "FFFFFF" : "000000"}FF:s=${baseWidth}x${baseHeight},format=rgba" \
                        -filter_complex "[1:v]${sizeFilter},hue=s=0[overlay];[2:v][overlay]overlay=x=${originXExpr}+${Math.round(offsetX)}:y=${originYExpr}+${Math.round(offsetY)}:format=auto,colorkey=0xFFFFFF:0.01:0,curves=r='0/0 1/0':g='0/0 1/${172/255}':b='0/0 1/${145/255}'[mask];[0:v][mask]overlay=shortest=1:x=0:y=0:format=auto,colorkey=0x00AC91:0.01:0,split[gnout][gpout];[gpout]palettegen=reserve_transparent=1[palette];[gnout][palette]paletteuse=alpha_threshold=128[out]" \
                        -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                }
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg ${maskType === "video" ? "" : "-stream_loop -1"} -i "${basePath}" \
                    ${baseType === "video" ? "" : "-stream_loop -1"} -i "${maskPath}" \
                    -f lavfi -i "color=0x${keep ? "FFFFFF" : "000000"}FF:s=${baseWidth}x${baseHeight},format=rgba" \
                    -map ${baseType === "video" ? "0" : "1"}:a? \
                    -filter_complex "[1:v]${sizeFilter},hue=s=0[overlay];[2:v][overlay]overlay=x=${originXExpr}+${Math.round(offsetX)}:y=${originYExpr}+${Math.round(offsetY)}:format=auto,colorkey=0xFFFFFF:0.01:1,curves=r='0/0 1/0':g='0/0 1/0':b='0/0 1/0'[mask];[0:v][mask]overlay=shortest=1:format=auto:x=0:y=0,scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -stream_loop -1 -i "${basePath}" -i "${maskPath}" \
                    -f lavfi -i "color=0x${keep ? "FFFFFF" : "000000"}FF:s=${baseWidth}x${baseHeight},format=rgba" \
                    -filter_complex "[1:v]${sizeFilter},hue=s=0[overlay];[2:v][overlay]overlay=x=${originXExpr}+${Math.round(offsetX)}:y=${originYExpr}+${Math.round(offsetY)}:format=auto,colorkey=0xFFFFFF:0.01:0,curves=r='0/0 1/0':g='0/0 1/${172/255}':b='0/0 1/${145/255}'[mask];[0:v][mask]overlay=shortest=1:x=0:y=0:format=auto,colorkey=0x00AC91:0.01:0,split[gnout][gpout];[gpout]palettegen=reserve_transparent=1[palette];[gnout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};