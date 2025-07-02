const { execPromise } = require("#functions/media");
const { makeTempPath, getAsset } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.melt.name"),
    description: translate("commands.melt.description"),
    category: translate("categories.effects"),
    args: require("#args/commands/effects/melt"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { decay, loop } = args;
        
        const { path: filePath, shortType, duration } = file;
        let tempPath;

        const decayValue = decay / 100;

        if (shortType === "video") {
            tempPath = makeTempPath("mp4");
            
            const loopOption = loop ? `-stream_loop -1` : "";
            const seekOption = loop ? `-ss ${duration}` : "";
            
            await execPromise(`ffmpeg ${loopOption} -i "${filePath}" -map 0:a? -b:a 10k \
                -filter_complex "[0:v]lagfun=decay=${decayValue},scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                -map "[out]" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p \
                ${seekOption} "${tempPath}"`);
        } else if (shortType === "gif") {
            tempPath = makeTempPath("gif");
            
            const loopOption = loop ? `-stream_loop -1` : "";
            const seekOption = loop ? `-ss ${duration}` : "";
            
            await execPromise(`ffmpeg ${loopOption} -i "${filePath}" -i "${getAsset("image", "black")}" \
                -filter_complex "[1:v][0:v]scale2ref[black][gif];[black]split[blackw][blackn];\
                [gif]hue=b=10[white];[blackw][white]overlay=x=0:y=0:format=auto,lagfun=decay=${decayValue}[meltalpha];\
                [blackn][0:v]overlay=x=0:y=0:format=auto,lagfun=decay=${decayValue}[melt];\
                [melt][meltalpha]alphamerge,split[pout][ppout];\
                [ppout]palettegen=reserve_transparent=1[palette];\
                [pout][palette]paletteuse=alpha_threshold=128[out]" \
                -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting \
                ${seekOption} "${tempPath}"`);
        }

        return new FileEmbed(tempPath);
    }
};