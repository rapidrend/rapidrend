const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.speedup.name"),
    description: translate("commands.speedup.description"),
    category: translate("categories.duration"),
    args: require("#args/commands/duration/speedup"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const speed = args.multiplier;

        const { path, shortType, audio } = file;

        let tempPath;

        const fps = file.fps.includes("0/0") ? "60" : file.fps;

        switch (shortType) {
            case "video":
                tempPath = makeTempPath("mp4");
                if (audio) {
                    await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:v]fps=fps='min(60,${fps}*${speed})',setpts=(1/${speed})*PTS,\
                        scale=ceil(iw/2)*2:ceil(ih/2)*2[v];[0:a]atempo=${speed}[a]" -map "[v]" -map "[a]" -preset ${args.encodingPreset} \
                        -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                } else {
                    await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:v]fps=fps='min(60,${fps}*${speed})',setpts=(1/${speed})*PTS,\
                        scale=ceil(iw/2)*2:ceil(ih/2)*2[v]" -map "[v]" -preset ${args.encodingPreset} \
                        -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                }
                break;

            case "audio":
                tempPath = makeTempPath("mp3");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:a]atempo=${speed}[a]" \
                    -map "[a]" -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:v]fps=fps='min(50,${fps}*${speed})',setpts=(1/${speed})*PTS,split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
}; 
