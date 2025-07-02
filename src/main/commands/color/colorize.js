const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.colorize.name"),
    description: translate("commands.colorize.description"),
    category: translate("categories.color"),
    args: require("#args/commands/color/colorize"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const { color: { r, g, b }, alpha: a, mode, desaturate } = args;

        const { path, shortType, width, height } = file;

        let tempPath;

        switch (mode) {
            case "light":
            case "dark":
                const curves = mode == "light"
                    ? `r='0/${r / 255} 1/1':g='0/${g / 255} 1/1':b='0/${b / 255} 1/1'`
                    : `r='0/0 1/${r / 255}':g='0/0 1/${g / 255}':b='0/0 1/${b / 255}'`;

                switch (shortType) {
                    case "image":
                        tempPath = makeTempPath("png");
                        await execPromise(`ffmpeg -i "${path}" -vf "${desaturate ? "hue=s=0," : ""}curves=${curves}" \
                            -preset ${args.encodingPreset} "${tempPath}"`);
                        break;

                    case "video":
                        tempPath = makeTempPath("mp4");
                        await execPromise(`ffmpeg -i "${path}" -vf "${desaturate ? "hue=s=0," : ""}curves=${curves}" \
                            -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                        break;

                    case "gif":
                        tempPath = makeTempPath("gif");
                        await execPromise(`ffmpeg -i "${path}" -vf "${desaturate ? "hue=s=0," : ""}curves=${curves},\
                            split[pout][ppout];[ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                            -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                        break;
                }
                break;

            case "tint":
                const color = `0x${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
                
                switch (shortType) {
                    case "image":
                        tempPath = makeTempPath("png");
                        await execPromise(`ffmpeg -i "${path}" -f lavfi -i "color=${color}:s=${width}x${height},format=rgba" \
                            -filter_complex "${desaturate ? "[0:v]hue=s=0[in];[in]" : "[0:v]"}[1:v]blend=shortest=1:all_mode=overlay:all_opacity=${a / 255}" \
                            -preset ${args.encodingPreset} "${tempPath}"`);
                        break;

                    case "video":
                        tempPath = makeTempPath("mp4");
                        await execPromise(`ffmpeg -i "${path}" -f lavfi -i "color=${color}:s=${width}x${height},format=rgba" \
                            -filter_complex "${desaturate ? "[0:v]hue=s=0[in];[in]" : "[0:v]"}[1:v]blend=shortest=1:all_mode=overlay:all_opacity=${a / 255}" \
                            -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                        break;

                    case "gif":
                        tempPath = makeTempPath("gif");
                        await execPromise(`ffmpeg -i "${path}" -f lavfi -i "color=${color}:s=${width}x${height},format=rgba" \
                            -filter_complex "${desaturate ? "[0:v]hue=s=0[in];[in]" : "[0:v]"}[1:v]blend=shortest=1:all_mode=overlay:all_opacity=${a / 255},split[pout][ppout];\
                            [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128" \
                            -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                        break;
                }
                break;
        }

        return new FileEmbed(tempPath);
    }
};