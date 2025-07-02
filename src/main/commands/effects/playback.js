const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.playback.name"),
    description: translate("commands.playback.description"),
    category: translate("categories.effects"),
    args: require("#args/commands/effects/playback"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { path: filePath, shortType, shortExt, audio } = file;
        
        const tempPath = makeTempPath(shortExt);

        switch (shortType) {
            case "video":
                if (args.mode === "reverse") {
                    if (audio) {
                        await execPromise(`ffmpeg -i "${filePath}" -filter_complex \
                            "[0:v]reverse,scale=ceil(iw/2)*2:ceil(ih/2)*2[v];[0:a]areverse[a]" \
                            -map "[v]" -map "[a]" -preset ${args.encodingPreset} \
                            -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                    } else {
                        await execPromise(`ffmpeg -i "${filePath}" -filter_complex \
                            "[0:v]reverse,scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                            -map "[out]" -preset ${args.encodingPreset} \
                            -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                    }
                } else if (args.mode === "boomerang") {
                    if (audio) {
                        await execPromise(`ffmpeg -i "${filePath}" -filter_complex \
                            "[0:v]reverse,scale=ceil(iw/2)*2:ceil(ih/2)*2[v];[0:a]areverse[a];\
                            [0:v][0:a][v][a]concat=n=2:v=1:a=1:unsafe=1[out]" \
                            -map "[out]" -preset ${args.encodingPreset} \
                            -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                    } else {
                        await execPromise(`ffmpeg -i "${filePath}" -filter_complex \
                            "[0:v]reverse[r];[0:v][r]concat,scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                            -map "[out]" -preset ${args.encodingPreset} \
                            -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                    }
                } else if (args.mode === "reverseBoomerang") {
                    if (audio) {
                        await execPromise(`ffmpeg -i "${filePath}" -filter_complex \
                            "[0:v]reverse,scale=ceil(iw/2)*2:ceil(ih/2)*2[v];[0:a]areverse[a];\
                            [v][a][0:v][0:a]concat=n=2:v=1:a=1:unsafe=1[out]" \
                            -map "[out]" -preset ${args.encodingPreset} \
                            -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                    } else {
                        await execPromise(`ffmpeg -i "${filePath}" -filter_complex \
                            "[0:v]reverse[r];[r][0:v]concat,scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                            -map "[out]" -preset ${args.encodingPreset} \
                            -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                    }
                }
                break;

            case "gif":
                if (args.mode === "reverse") {
                    await execPromise(`ffmpeg -i "${filePath}" -filter_complex \
                        "[0:v]reverse,split[pout][ppout];[ppout]palettegen=reserve_transparent=1[palette];\
                        [pout][palette]paletteuse=alpha_threshold=128[out]" \
                        -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                } else if (args.mode === "boomerang") {
                    await execPromise(`ffmpeg -i "${filePath}" -filter_complex \
                        "[0:v]reverse[r];[0:v][r]concat,split[pout][ppout];\
                        [ppout]palettegen=reserve_transparent=1[palette];\
                        [pout][palette]paletteuse=alpha_threshold=128[out]" \
                        -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                } else if (args.mode === "reverseBoomerang") {
                    await execPromise(`ffmpeg -i "${filePath}" -filter_complex \
                        "[0:v]reverse[r];[r][0:v]concat,split[pout][ppout];\
                        [ppout]palettegen=reserve_transparent=1[palette];\
                        [pout][palette]paletteuse=alpha_threshold=128[out]" \
                        -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                }
                break;

            case "audio":
                if (args.mode === "reverse") {
                    await execPromise(`ffmpeg -i "${filePath}" -filter_complex \
                        "[0:a]areverse[out]" -map "[out]" \
                        -preset ${args.encodingPreset} "${tempPath}"`);
                } else if (args.mode === "boomerang") {
                    await execPromise(`ffmpeg -i "${filePath}" -filter_complex \
                        "[0:a]areverse[r];[0:a][r]concat=v=0:a=1[out]" -map "[out]" \
                        -preset ${args.encodingPreset} "${tempPath}"`);
                } else if (args.mode === "reverseBoomerang") {
                    await execPromise(`ffmpeg -i "${filePath}" -filter_complex \
                        "[0:a]areverse[r];[r][0:a]concat=v=0:a=1[out]" -map "[out]" \
                        -preset ${args.encodingPreset} "${tempPath}"`);
                }
                break;
        }

        return new FileEmbed(tempPath);
    }
};