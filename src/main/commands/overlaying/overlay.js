const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");
const { parseTimestamp } = require("#functions/arguments");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.overlay.name"),
    description: translate("commands.overlay.description"),
    category: translate("categories.overlaying"),
    args: {
        baseFile: {
            name: translate("commands.overlay.args.baseFile.name"),
            desc: translate("commands.overlay.args.baseFile.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: { type: "mime", list: ["image", "video", "gif"] }
            }
        },
        overlayFile: {
            name: translate("commands.overlay.args.overlayFile.name"),
            desc: translate("commands.overlay.args.overlayFile.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: { type: "mime", list: ["image", "video", "gif"] }
            }
        },
        origin: {
            name: translate("commands.overlay.args.origin.name"),
            desc: translate("commands.overlay.args.origin.desc"),
            type: "string",
            required: false,
            settings: {
                dft: 'center middle',
                allowed: [
                    'left top', 'center top', 'right top',
                    'left middle', 'center middle', 'right middle',
                    'left bottom', 'center bottom', 'right bottom'
                ]
            }
        },
        offsetX: {
            name: translate("commands.overlay.args.offsetX.name"),
            desc: translate("commands.overlay.args.offsetX.desc"),
            type: "number",
            required: false,
            settings: { dft: 0 }
        },
        offsetY: {
            name: translate("commands.overlay.args.offsetY.name"),
            desc: translate("commands.overlay.args.offsetY.desc"),
            type: "number",
            required: false,
            settings: { dft: 0 }
        },
        width: {
            name: translate("commands.overlay.args.width.name"),
            desc: translate("commands.overlay.args.width.desc"),
            type: "string",
            required: false
        },
        height: {
            name: translate("commands.overlay.args.height.name"),
            desc: translate("commands.overlay.args.height.desc"),
            type: "string",
            required: false
        },
        keepAspect: {
            name: translate("commands.overlay.args.keepAspect.name"),
            desc: translate("commands.overlay.args.keepAspect.desc"),
            type: "boolean",
            required: false
        },
        startTime: {
            name: translate("commands.overlay.args.startTime.name"),
            desc: translate("commands.overlay.args.startTime.desc"),
            type: "timestamp",
            required: false
        },
        endTime: {
            name: translate("commands.overlay.args.endTime.name"),
            desc: translate("commands.overlay.args.endTime.desc"),
            type: "timestamp",
            required: false
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const { baseFile, overlayFile } = args;
        const origins = {
            x: { left: '0', center: '(W-w)/2', right: '(W-w)' },
            y: { top: '0', middle: '(H-h)/2', bottom: '(H-h)' }
        };

        let [originX = 'center', originY = 'middle'] = args.origin?.split(' ') || [];
        const xPos = origins.x[originX] || origins.x.center;
        const yPos = origins.y[originY] || origins.y.middle;

        const width = args.width ? 
            args.width.endsWith('%') ? 
                `iw*${parseInt(args.width)/100}` : 
                args.width : 
            'iw';
        const height = args.height ? 
            args.height.endsWith('%') ? 
                `ih*${parseInt(args.height)/100}` : 
                args.height : 
            'ih';

        const start = args.startTime ? parseTimestamp(args.startTime) : 0;
        const end = args.endTime ? parseTimestamp(args.endTime) : baseFile.duration;

        let tempPath = makeTempPath(baseFile.shortType === 'video' ? 'mp4' : 'gif');
        
        const complexFilter = [
            `[1:v]scale=${width}:${height}${args.keepAspect ? `:force_original_aspect_ratio=${args.keepAspect}` : ''}[ovly]`,
            `[0:v][ovly]overlay=${xPos}+${args.offsetX}:${yPos}+${args.offsetY}`,
            `enable='between(t,${start},${end})'`
        ].join(',');

        await execPromise(`ffmpeg -i "${baseFile.path}" -i "${overlayFile.path}" ` +
            `-filter_complex "${complexFilter}" ` +
            `-preset ${args.encodingPreset} ` +
            (baseFile.shortType === 'video' ? 
                '-c:v libx264 -pix_fmt yuv420p ' : 
                '-gifflags -offsetting ') +
            `"${tempPath}"`);

        return new FileEmbed(tempPath);
    }
};