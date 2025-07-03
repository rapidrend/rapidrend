const FileEmbed = require("#classes/FileEmbed");

const { execPromise } = require("#functions/media");
const { makeTempPath, getAsset } = require("#functions/filesystem");
const { translate } = require("#functions/translate");
const { rgbToHex } = require("#functions/math");

module.exports = {
    name: translate("commands.caption.name"),
    description: translate("commands.caption.description"),
    category: translate("categories.captions"),
    args: require("#args/commands/captions/caption"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { text, size, color, bgColor, font } = args;

        const { path: filePath, shortType, shortExt, width, fps } = file;
        const tempPath = makeTempPath(shortExt);
        const tempDir = tempPath.replace(/\.[^\/\\]+$/, "");

        const textColor = rgbToHex(color);
        const backgroundColor = rgbToHex(bgColor);

        const captionPath = `${tempDir}_caption.png`;

        const baseFontSize = Math.round(width * 0.1);
        const fontSize = Math.round(baseFontSize * size);
        const fontMargin = Math.round(baseFontSize * 0.5);

        console.log(font)

        if (text.trim()) {
            await execPromise(`magick -background "${backgroundColor}" -fill "${textColor}" \
                -font "${font ?? getAsset("font", "futura").replace(/\\/g, "\\\\")}" -gravity center \
                -pointsize ${fontSize} -size ${width - fontMargin * 2}x \
                caption:"${text.replace(/"/g, '\\"').replace(/\\/g, "\\\\")}" \
                -bordercolor "${backgroundColor}" -border ${fontMargin} \
                -alpha on "${captionPath}"`);
        } else {
            await execPromise(`magick -size ${width}x${fontSize * text.split("\n").length + fontMargin * 2} \
                canvas:"${backgroundColor}" "${captionPath}"`);
        }

        const fpsFilter = fps.includes("0/0") ? "" : `-r ${fps} `;

        switch (shortType) {
            case "image":
                await execPromise(`ffmpeg -i "${filePath}" -i "${captionPath}" \
                    -filter_complex "[1:v]format=rgba[cap];[cap][0:v]vstack=inputs=2[out]" -map "[out]" \
                    -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                await execPromise(`ffmpeg ${fpsFilter}-i "${filePath}" \
                    ${fpsFilter}-i "${captionPath}" \
                    -map 1:a? \
                    -filter_complex "[1:v]format=rgba[cap];[cap][0:v]vstack=inputs=2[oout];\
                    [oout]scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                await execPromise(`ffmpeg ${fpsFilter}-i "${filePath}" \
                    ${fpsFilter}-i "${captionPath}" \
                    -filter_complex "[1:v]format=rgba[cap];[cap][0:v]vstack=inputs=2[oout];\
                    [oout]split[pout][ppout];[ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};