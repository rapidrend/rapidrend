const { execPromise } = require("#functions/media");
const { makeTempPath, getAsset } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.scale.name"),
    description: translate("commands.scale.description"),
    category: translate("categories.resizing"),
    args: require("#args/commands/resizing/scale"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { width, height, mode, scaleAlgorithm, originX, originY, keepAspectRatio } = args;

        const { path, shortType } = file;

        let tempPath;

        switch (mode) {
            case "scale":
                switch (shortType) {
                    case "image":
                        tempPath = makeTempPath("png");
                        await execPromise(`ffmpeg -i "${path}" \
                            -vf "scale=${width}:${height}:flags=${scaleAlgorithm}${keepAspectRatio != "no" ? `:force_original_aspect_ratio=${keepAspectRatio}` : ""}" \
                            -preset ${args.encodingPreset} "${tempPath}"`);
                        break;

                    case "video":
                        tempPath = makeTempPath("mp4");
                        await execPromise(`ffmpeg -i "${path}" -map 0:a? \
                            -vf "scale=${width}:${height}:flags=${scaleAlgorithm}${keepAspectRatio != "no" ? `:force_original_aspect_ratio=${keepAspectRatio}` : ""},\
                            scale=ceil(iw/2)*2:ceil(ih/2)*2" \
                            -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                        break;

                    case "gif":
                        tempPath = makeTempPath("gif");
                        await execPromise(`ffmpeg -i "${path}" \
                            -vf "scale=${width}:${height}:flags=${scaleAlgorithm}${keepAspectRatio != "no" ? `:force_original_aspect_ratio=${keepAspectRatio}` : ""},\
                            split[pout][ppout];\
                            [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                            -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                        break;
                }
                break;

            case "area":
                const bgWidth = width;
                const bgHeight = height;
                const overlayX = originX === 'left' ? '0' :
                    originX === 'right' ? `W-w` : `(W-w)/2`;
                const overlayY = originY === 'top' ? '0' :
                    originY === 'bottom' ? `H-h` : `(H-h)/2`;

                switch (shortType) {
                    case "image":
                        tempPath = makeTempPath("png");
                        await execPromise(`ffmpeg -i "${path}" -i "${getAsset("image", "transparent")}" \
                            -filter_complex "[1:v]scale=${bgWidth}:${bgHeight}[background];\
                            [background][0:v]overlay=x=${overlayX}:y=${overlayY}:format=auto[out]" \
                            -map "[out]" -preset ${args.encodingPreset} "${tempPath}"`);
                        break;

                    case "video":
                        tempPath = makeTempPath("mp4");
                        await execPromise(`ffmpeg -i "${path}" -i "${getAsset("image", "transparent")}" \
                            -map 0:a? -filter_complex "[1:v]scale=${bgWidth}:${bgHeight}[background];\
                            [background][0:v]overlay=x=${overlayX}:y=${overlayY}:format=auto,scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                            -map "[out]" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                        break;

                    case "gif":
                        tempPath = makeTempPath("gif");
                        await execPromise(`ffmpeg -i "${path}" -i "${getAsset("image", "transparent")}" \
                            -filter_complex "[1:v]scale=${bgWidth}:${bgHeight}[background];\
                            [background][0:v]overlay=x=${overlayX}:y=${overlayY}:format=auto,split[pout][ppout];\
                            [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
                            -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                        break;
                }
                break;

            case "zoom":
                const zoomX = originX === 'left' ? '0' :
                    originX === 'right' ? `W-w` : `(W-w)/2`;
                const zoomY = originY === 'top' ? '0' :
                    originY === 'bottom' ? `H-h` : `(H-h)/2`;

                switch (shortType) {
                    case "image":
                        tempPath = makeTempPath("png");
                        await execPromise(`ffmpeg -i "${path}" -i "${getAsset("image", "transparent")}" \
                            -filter_complex "[1:v][0:v]scale2ref[background][input];\
                            [input]scale=${width}:${height}:flags=${scaleAlgorithm}[overlay];\
                            [background][overlay]overlay=x=${zoomX}:y=${zoomY}:format=auto[out]" \
                            -map "[out]" -preset ${args.encodingPreset} "${tempPath}"`);
                        break;

                    case "video":
                        tempPath = makeTempPath("mp4");
                        await execPromise(`ffmpeg -i "${path}" -i "${getAsset("image", "transparent")}" \
                            -map 0:a? -filter_complex "[1:v][0:v]scale2ref[background][input];\
                            [input]scale=${width}:${height}:flags=${scaleAlgorithm}[overlay];\
                            [background][overlay]overlay=x=${zoomX}:y=${zoomY}:format=auto,scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                            -map "[out]" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                        break;

                    case "gif":
                        tempPath = makeTempPath("gif");
                        await execPromise(`ffmpeg -i "${path}" -i "${getAsset("image", "transparent")}" \
                            -filter_complex "[1:v][0:v]scale2ref[background][input];\
                            [input]scale=${width}:${height}:flags=${scaleAlgorithm}[overlay];\
                            [background][overlay]overlay=x=${zoomX}:y=${zoomY}:format=auto,split[pout][ppout];\
                            [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
                            -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                        break;
                }
                break;
        }

        return new FileEmbed(tempPath);
    }
};