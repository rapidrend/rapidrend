const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.offset.name"),
    description: translate("commands.offset.description"),
    category: translate("categories.duration"),
    args: require("#args/commands/duration/offset"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { timestamp } = args;

        const { path, shortType, audio: hasAudio } = file;

        const tempPath = makeTempPath(shortType);

        switch (shortType) {
            case "video":
                await execPromise(`ffmpeg -ss ${timestamp} -i "${path}" -t ${timestamp} -i "${path}" \
                    -filter_complex "[0:v][1:v]concat,scale=ceil(iw/2)*2:ceil(ih/2)*2[v]${hasAudio ? `;[0:a][1:a]concat=a=1:v=0[a]` : ''}" \
                    -map "[v]" ${hasAudio ? `-map "[a]" ` : ''}-preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "audio":
                await execPromise(`ffmpeg -ss ${timestamp} -i "${path}" -t ${timestamp} -i "${path}" \
                    -filter_complex "[0:a][1:a]concat=a=1:v=0[out]" \
                    -map "[out]" -preset ${args.encodingPreset} "${tempPath}"`);
                break;

            case "gif":
                await execPromise(`ffmpeg -ss ${timestamp} -i "${path}" -t ${timestamp} -i "${path}" \
                    -filter_complex "[0:v][1:v]concat,split[pout][ppout];[ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};