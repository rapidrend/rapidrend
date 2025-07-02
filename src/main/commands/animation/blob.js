const { execPromise } = require("#functions/media");
const { makeTempPath, getAsset } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.blob.name"),
    description: translate("commands.blob.description"),
    category: translate("categories.animation"),
    args: require("#args/commands/animation/blob"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const duration = args.duration;

        const { path: filePath, shortType, type: { ext }, width, height, fps } = file;
        let tempPath;

        switch (shortType) {
            case "image":
            case "gif":
                tempPath = makeTempPath("gif");
                await execPromise(`ffmpeg -stream_loop -1 -t ${duration} ${ext === "jpg" ? "-f image2 " : ""}-i "${filePath}" \
                    -r 50 -stream_loop -1 -t ${duration} -i ${getAsset("image", "transparent")} \
                    -filter_complex "[1:v][0:v]scale2ref=w=iw+iw/10:h=ih[transparent][overlay];\
                    [overlay]fps=50,scale=iw+sin(PI/2*(t*4/${duration}))*(iw/10):ih+cos(PI/2*(t*4/${duration}))*(ih/3)-ih/3:eval=frame[ooverlay];\
                    [transparent][ooverlay]overlay=x=(W-w)/2:y=(H-h):format=auto,split[pout][ppout];\
                    [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
                    -map "[out]" -aspect ${Math.floor(width + width / 10)}:${height} -preset ${args.encodingPreset} \
                    -gifflags -offsetting -r 50 -t ${duration} "${tempPath}"`);
                break;
            
            case "video":
                tempPath = makeTempPath("mp4");
                await execPromise(`ffmpeg -r ${fps.includes("0/0") ? "60" : fps} -i "${filePath}" \
                    -r ${fps.includes("0/0") ? "60" : fps} -i ${getAsset("image", "transparent")} \
                    -filter_complex "[1:v][0:v]scale2ref=w=iw+iw/10:h=ih[transparent][overlay];\
                    [overlay]scale=iw+sin(PI/2*(t*4/${duration}))*(iw/10):ih+cos(PI/2*(t*4/${duration}))*(ih/3)-ih/3:eval=frame[ooverlay];\
                    [transparent][ooverlay]overlay=x=(W-w)/2:y=(H-h):format=auto,scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                    -map "[out]" -map 0:a? -c:v libx264 -pix_fmt yuv420p \
                    -aspect ${Math.floor(width + width / 10)}:${height} -preset ${args.encodingPreset} "${tempPath}"`);
                break;
        }

        return new FileEmbed(tempPath);
    }
}