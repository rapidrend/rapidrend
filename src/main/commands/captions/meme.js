const FileEmbed = require("#classes/FileEmbed");

const { execPromise } = require("#functions/media");
const { makeTempPath, getAsset } = require("#functions/filesystem");
const { translate } = require("#functions/translate");
const { rgbToHex } = require("#functions/math");

module.exports = {
    name: translate("commands.meme.name"),
    description: translate("commands.meme.description"),
    category: translate("categories.captions"),
    args: require("#args/commands/captions/meme"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { topText, bottomText, size, borderSize, color, borderColor, font } = args;

        const { path: filePath, shortType, shortExt, width, fps } = file;
        const tempPath = makeTempPath(shortExt);
        const tempDir = tempPath.replace(/\.[^\/\\]+$/, "");

        const textColor = rgbToHex(color);

        const baseFontSize = Math.round(width * 0.1);
        const fontSize = Math.round(baseFontSize * size);
        const fontMargin = Math.round(baseFontSize * 0.25);
        const strokeWidth = borderSize == 0 ? 0 : Math.max(Math.round(fontSize * 0.05) * borderSize, 1);

        const topCaptionPath = `${tempDir}_top.png`;
        const bottomCaptionPath = `${tempDir}_bottom.png`;

        const createCaptionImage = async (text, outputPath) => {
            if (text.trim()) {
                await execPromise(`magick -background none -fill "${textColor}" \
                    -font "${font ?? getAsset("font", "impact")}" -gravity center \
                    -pointsize ${fontSize} -size ${width - fontMargin * 2}x \
                    caption:"${text.replace(/"/g, '\\"')}" \
                    -bordercolor none -border ${fontMargin} \
                    -alpha on "${outputPath}"`);
                return true;
            }

            return false;
        }

        const [hasTopText, hasBottomText] = await Promise.all([
            createCaptionImage(topText, topCaptionPath),
            createCaptionImage(bottomText, bottomCaptionPath)
        ]);

        const borderCaption = (side) => {
            const baseBorder = `format=rgba,curves=r='0/1 1/1':g='0/1 1/1':b='0/1 1/1',\
                curves=r='0/0 1/${borderColor.r / 255}':g='0/0 1/${borderColor.g / 255}':b='0/0 1/${borderColor.b / 255}'`;

            const borderDilate = Array.from(
                { length: strokeWidth }, (_, i) => `dilation${i % 2 == 0 ? "=coordinates=90" : ""}`
            );

            if (borderDilate.length <= 0) borderDilate.push("null");

            return `${side == "top" || !hasTopText ? "[1:v]" : "[2:v]"}${baseBorder},${borderDilate.join(",")}[${side}Border]`
        }

        let filterComplex = "";
        if (hasTopText) {
            filterComplex += `${borderCaption("top")};[0:v][topBorder]overlay=x=(W-w)/2:y=0:format=auto[topCaption];[topCaption][1:v]overlay=x=(W-w)/2:y=0:format=auto[top];`;
        } else {
            filterComplex += "[0:v]copy[top];";
        }
        
        if (hasBottomText) {
            filterComplex += `${borderCaption("bottom")};[top][bottomBorder]overlay=x=(W-w)/2:y=H-h:format=auto[bottomCaption];[bottomCaption][${hasTopText ? "2:v" : "1:v"}]overlay=x=(W-w)/2:y=H-h:format=auto`;
        } else {
            filterComplex += "[top]copy";
        }

        const fpsFilter = fps.includes("0/0") ? "" : `-r ${fps} `;

        switch (shortType) {
            case "image":
                await execPromise(`ffmpeg -i "${filePath}" \
                    ${hasTopText ? `-i "${topCaptionPath}"` : ""} \
                    ${hasBottomText ? `-i "${bottomCaptionPath}"` : ""} \
                    -filter_complex "${filterComplex}[out]" \
                    -map "[out]" -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                await execPromise(`ffmpeg ${fpsFilter}-i "${filePath}" \
                    ${hasTopText ? `${fpsFilter}-i "${topCaptionPath}"` : ""} \
                    ${hasTopText ? `${fpsFilter}-i "${bottomCaptionPath}"` : ""} \
                    -map 0:a? \
                    -filter_complex "${filterComplex},scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                await execPromise(`ffmpeg ${fpsFilter}-i "${filePath}" \
                    ${hasTopText ? `${fpsFilter}-i "${topCaptionPath}"` : ""} \
                    ${hasTopText ? `${fpsFilter}-i "${bottomCaptionPath}"` : ""} \
                    -filter_complex "${filterComplex},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];\
                    [pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};