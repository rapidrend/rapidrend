const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.slowdown.name"),
    description: translate("commands.slowdown.description"),
    category: translate("categories.duration"),
    args: require("#args/commands/duration/slowdown"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const speed = args.multiplier;

        let speedMult = speed;
        let speedFilter = [];

        while (speedMult > 2) {
            speedMult /= 2
            speedFilter.push(`atempo=0.5`);
        }

        speedFilter.push(`atempo=(1/${speedMult})`);

        const { path, shortType, audio } = file;

        let tempPath;

        const fps = file.fps.includes("0/0") ? "60" : file.fps;

        switch (shortType) {
            case "video":
                tempPath = makeTempPath("mp4");
                if (audio) {
                    await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:v]setpts=${speed}*PTS,fps=fps=${fps}/${speed},\
                        scale=ceil(iw/2)*2:ceil(ih/2)*2[v];[0:a]${speedFilter.join(",")}[a]" -map "[v]" -map "[a]" -preset ${args.encodingPreset} \
                        -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                } else {
                    await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:v]setpts=${speed}*PTS,fps=fps=${fps}/${speed},\
                        scale=ceil(iw/2)*2:ceil(ih/2)*2[v]" -map "[v]" -preset ${args.encodingPreset} \
                        -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                }
                break;

            case "audio":
                tempPath = makeTempPath("mp3");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:a]${speedFilter.join(",")}[a]" \
                    -map "[a]" -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:v]setpts=${speed}*PTS,fps=fps=${fps}/${speed},split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};
