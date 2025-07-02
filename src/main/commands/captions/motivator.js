const FileEmbed = require("#classes/FileEmbed");

const { execPromise } = require("#functions/media");
const { makeTempPath, getAsset } = require("#functions/filesystem");
const { translate } = require("#functions/translate");
const { rgbToHex } = require("#functions/math");

module.exports = {
    name: translate("commands.motivator.name"),
    description: translate("commands.motivator.description"),
    category: translate("categories.captions"),
    args: require("#args/commands/captions/motivator"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { topText, bottomText, color, bgColor, topFont, bottomFont } = args;

        const { path: filePath, shortType, shortExt, fps } = file;
        const tempPath = makeTempPath(shortExt);
        const tempDir = tempPath.replace(/\.[^\/\\]+$/, "");

        const topCaptionPath = `${tempDir}_top.png`;
        const bottomCaptionPath = `${tempDir}_bottom.png`;

        const captionPath = `${tempDir}_caption.png`;

        const textColor = rgbToHex(color);
        const backgroundColor = rgbToHex(bgColor);

        const createCaptionImage = async (text, font, size, border, outputPath) => {
            if (text.trim()) {
                await execPromise(`magick -background "${backgroundColor}" -fill "${textColor}" \
                    -font "${font}" -gravity center \
                    -pointsize ${size} -size 460x \
                    caption:"${text.replace(/"/g, '\\"')}" \
                    -bordercolor "${backgroundColor}" -border 20x${border} \
                    "${outputPath}"`);
            } else {
                await execPromise(`magick -size 500x${size * text.split("\n").length + border * 2} \
                    canvas:"${backgroundColor}" "${outputPath}"`);
            }
        }
        
        await Promise.all([
            createCaptionImage(
                topText, topFont ?? getAsset("font", "times"), 48, 0, topCaptionPath
            ),
            createCaptionImage(
                bottomText, bottomFont ?? getAsset("font", "arial"), 20, 10, bottomCaptionPath
            )
        ]);

        await execPromise(`magick \
            "${tempDir}_top.png" "${tempDir}_bottom.png" \
            -append "${captionPath}"`);

        switch (shortType) {
            case "image":
                await execPromise(`ffmpeg -i "${filePath}" -i "${captionPath}" \
                    -filter_complex "[0:v]scale=400:400:force_original_aspect_ratio=decrease,\
                    pad=iw+4:ih+4:2:2:color=0x${backgroundColor.replace("#", "")}ff,\
                    pad=iw+4:ih+4:2:2:color=0x${textColor.replace("#", "")}ff,\
                    pad=500:ih+52:(500-iw)/2:26:color=0x${backgroundColor.replace("#", "")}ff[bordered];\
                    [1:v]format=rgba,pad=iw:ih+20:0:0:color=0x${backgroundColor.replace("#", "")}ff[caption];\
                    [bordered][caption]vstack=inputs=2[out]" \
                    -map "[out]" -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "video":
                await execPromise(`ffmpeg ${fps.includes("0/0") ? "" : `-r ${fps.includes("0/0") ? "60" : fps} `}-i "${filePath}" \
                    ${fps.includes("0/0") ? "" : `-r ${fps.includes("0/0") ? "60" : fps} `}-i "${captionPath}" \
                    -map 0:a? \
                    -filter_complex "[0:v]scale=400:400:force_original_aspect_ratio=decrease,\
                    pad=iw+4:ih+4:2:2:color=0x${backgroundColor.replace("#", "")}ff,\
                    pad=iw+4:ih+4:2:2:color=0x${textColor.replace("#", "")}ff,\
                    pad=500:ih+52:(500-iw)/2:26:color=0x${backgroundColor.replace("#", "")}ff[bordered];\
                    [1:v]format=rgba,pad=iw:ih+20:0:0:color=0x${backgroundColor.replace("#", "")}ff[caption];\
                    [bordered][caption]vstack=inputs=2[oout];\
                    [oout]scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                await execPromise(`ffmpeg ${fps.includes("0/0") ? "" : `-r ${fps.includes("0/0") ? "50" : fps} `}-i "${filePath}" \
                    ${fps.includes("0/0") ? "" : `-r ${fps.includes("0/0") ? "50" : fps} `}-i "${captionPath}" \
                    -filter_complex "[0:v]scale=400:400:force_original_aspect_ratio=decrease,\
                    pad=iw+4:ih+4:2:2:color=0x${backgroundColor.replace("#", "")}ff,\
                    pad=iw+4:ih+4:2:2:color=0x${textColor.replace("#", "")}ff,\
                    pad=500:ih+52:(500-iw)/2:26:color=0x${backgroundColor.replace("#", "")}ff[bordered];\
                    [1:v]format=rgba,pad=iw:ih+20:0:0:color=0x${backgroundColor.replace("#", "")}ff[caption];\
                    [bordered][caption]vstack=inputs=2[oout];[oout]split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];\
                    [pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};