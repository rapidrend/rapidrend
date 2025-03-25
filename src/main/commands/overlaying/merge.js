const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.merge.name"),
    description: translate("commands.merge.description"),
    category: translate("categories.overlaying"),
    args: {
        file1: {
            name: translate("commands.merge.args.file1.name"),
            desc: translate("commands.merge.args.file1.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        file2: {
            name: translate("commands.merge.args.file2.name"),
            desc: translate("commands.merge.args.file2.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        direction: {
            name: translate("commands.merge.args.direction.name"),
            desc: translate("commands.merge.args.direction.desc"),
            type: "string",
            required: false,
            settings: {
                allowed: ["horizontal", "vertical"],
                dft: "horizontal"
            }
        },
        swap: {
            name: translate("commands.merge.args.swap.name"),
            desc: translate("commands.merge.args.swap.desc"),
            type: "boolean",
            required: false,
            settings: {
                dft: false
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file1 = args.swap ? args.file2 : args.file1;
        const file2 = args.swap ? args.file1 : args.file2;
        const direction = args.direction;
        
        const { path: path1, shortType: type1, width: width1, height: height1 } = file1;
        const { path: path2, shortType: type2 } = file2;

        // Determine which dimension to match based on direction
        const matchDimension = direction === "vertical" ? "width" : "height";
        const targetSize = direction === "vertical" ? width1 : height1;
        const stackFilter = direction === "vertical" ? "vstack" : "hstack";

        let tempPath;

        // Handle different file type combinations
        switch (type1) {
            case "image":
                if (type2 === "image") {
                    tempPath = makeTempPath("png");
                    await execPromise(`ffmpeg -i "${path1}" -i "${path2}" \
                        -filter_complex "[0:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file1];\
                        [1:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file2];\
                        [file1][file2]${stackFilter}=shortest=1[out]" \
                        -map "[out]" -preset ${args.encodingPreset} "${tempPath}"`);
                } else if (type2 === "gif") {
                    tempPath = makeTempPath("gif");
                    await execPromise(`ffmpeg -stream_loop -1 -r ${file2.fps || 50} -i "${path1}" -r ${file2.fps || 50} -i "${path2}" \
                        -filter_complex "[0:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file1];\
                        [1:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file2];\
                        [file1][file2]${stackFilter}=shortest=1[qout];\
                        [qout]scale='min(400,iw)':min'(400,ih)':force_original_aspect_ratio=decrease[rout];\
                        [rout]split[gnout][gpout];[gpout]palettegen=reserve_transparent=1[palette];\
                        [gnout][palette]paletteuse=alpha_threshold=128[out]" \
                        -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                } else if (type2 === "video") {
                    tempPath = makeTempPath("mp4");
                    await execPromise(`ffmpeg -stream_loop -1 -r ${file2.fps || 60} -i "${path1}" -r ${file2.fps || 60} -i "${path2}" \
                        -filter_complex "[0:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file1];\
                        [1:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file2];\
                        [file1][file2]${stackFilter}=shortest=1[sout];\
                        [sout]scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                        -map "[out]" -map "1:a?" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                }
                break;

            case "gif":
                if (type2 === "image") {
                    tempPath = makeTempPath("gif");
                    await execPromise(`ffmpeg -r ${file1.fps || 50} -i "${path1}" -stream_loop -1 -r ${file1.fps || 50} -i "${path2}" \
                        -filter_complex "[0:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file1];\
                        [1:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file2];\
                        [file1][file2]${stackFilter}=shortest=1[sout];\
                        [sout]split[gnout][gpout];[gpout]palettegen=reserve_transparent=1[palette];\
                        [gnout][palette]paletteuse=alpha_threshold=128[out]" \
                        -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                } else if (type2 === "gif") {
                    tempPath = makeTempPath("gif");
                    await execPromise(`ffmpeg -stream_loop -1 -r ${Math.max(file1.fps || 50, file2.fps || 50)} -i "${path1}" \
                        -r ${Math.max(file1.fps || 50, file2.fps || 50)} -i "${path2}" \
                        -filter_complex "[0:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file1];\
                        [1:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file2];\
                        [file1][file2]${stackFilter}=shortest=1[rout];\
                        [rout]split[gnout][gpout];[gpout]palettegen=reserve_transparent=1[palette];\
                        [gnout][palette]paletteuse=alpha_threshold=128[out]" \
                        -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting "${tempPath}"`);
                } else if (type2 === "video") {
                    tempPath = makeTempPath("mp4");
                    await execPromise(`ffmpeg -stream_loop -1 -r ${Math.max(file1.fps || 50, file2.fps || 60)} -i "${path1}" \
                        -r ${Math.max(file1.fps || 50, file2.fps || 60)} -i "${path2}" \
                        -filter_complex "[0:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file1];\
                        [1:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file2];\
                        [file1][file2]${stackFilter}=shortest=1[sout];\
                        [sout]scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                        -map "[out]" -map "1:a?" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                }
                break;

            case "video":
                if (type2 === "image") {
                    tempPath = makeTempPath("mp4");
                    await execPromise(`ffmpeg -r ${file1.fps || 60} -i "${path1}" -stream_loop -1 -r ${file1.fps || 60} -i "${path2}" \
                        -filter_complex "[0:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file1];\
                        [1:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file2];\
                        [file1][file2]${stackFilter}=shortest=1[sout];\
                        [sout]scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                        -map "[out]" -map "0:a?" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                } else if (type2 === "gif") {
                    tempPath = makeTempPath("mp4");
                    await execPromise(`ffmpeg -r ${Math.max(file1.fps || 60, file2.fps || 50)} -i "${path1}" \
                        -stream_loop -1 -r ${Math.max(file1.fps || 60, file2.fps || 50)} -i "${path2}" \
                        -filter_complex "[0:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file1];\
                        [1:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file2];\
                        [file1][file2]${stackFilter}=shortest=1[sout];\
                        [sout]scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                        -map "[out]" -map "0:a?" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                } else if (type2 === "video") {
                    tempPath = makeTempPath("mp4");
                    await execPromise(`ffmpeg -r ${Math.max(file1.fps || 60, file2.fps || 60)} -i "${path1}" \
                        -r ${Math.max(file1.fps || 60, file2.fps || 60)} -i "${path2}" \
                        -filter_complex "[0:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file1];\
                        [1:v]scale=${matchDimension === "width" ? targetSize : -1}:${matchDimension === "height" ? targetSize : -1}[file2];\
                        [file1][file2]${stackFilter}=shortest=1[sout];\
                        [sout]scale=ceil(iw/2)*2:ceil(ih/2)*2[out]" \
                        -map "[out]" -map "0:a?" -preset ${args.encodingPreset} -c:v libx264 -pix_fmt yuv420p "${tempPath}"`);
                }
                break;
        }

        return new FileEmbed(tempPath);
    }
};