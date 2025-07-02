const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.rainbow.name"),
    description: translate("commands.rainbow.description"),
    category: translate("categories.color"),
    args: require("#args/commands/color/rainbow"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const duration = args.duration;

        const { path, shortType } = file;

        let tempPath;

        switch (shortType) {
            case "image":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -stream_loop -1 -t ${duration} -r 50 -i "${path}" \
                    -filter_complex "[0:v]hue=s=0,negate,curves=r='0/0 1/1':g='0/0 1/0':b='0/0 1/0',\
                    hue=H=(PI*2)*(t/${duration}-0.5),negate,split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;

            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -i "${path}" -map 0:a? -filter_complex "[0:v]hue=s=0,negate,curves=r='0/0 1/1':g='0/0 1/0':b='0/0 1/0',\
                    hue=H=(PI*2)*(t/${duration}-0.5),negate,scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                break;

            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -i "${path}" -filter_complex "[0:v]hue=s=0,negate,curves=r='0/0 1/1':g='0/0 1/0':b='0/0 1/0',\
                    hue=H=(PI*2)*(t/${duration}-0.5),negate,split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
};