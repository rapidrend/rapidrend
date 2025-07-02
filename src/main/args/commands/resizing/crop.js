const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.crop.args.input.name"),
        desc: translate("commands.crop.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    x: {
        name: translate("commands.crop.args.x.name"),
        desc: translate("commands.crop.args.x.desc"),
        type: "pixels",
        required: false,
        settings: {
            dft: 0,
            min: 0,
            max: (args) => args.input && args.input.width - 1,
            round: true
        },
        gui: {
            more: true,
            group: "offset",
            order: 0,
            width: 50
        }
    },
    y: {
        name: translate("commands.crop.args.y.name"),
        desc: translate("commands.crop.args.y.desc"),
        type: "pixels",
        required: false,
        settings: {
            dft: 0,
            min: 0,
            max: (args) => args.input && args.input.height - 1,
            round: true
        },
        gui: {
            more: true,
            group: "offset",
            order: 1,
            width: 50
        }
    },
    width: {
        alias: "w",
        name: translate("commands.crop.args.width.name"),
        desc: translate("commands.crop.args.width.desc"),
        type: "pixels",
        required: false,
        settings: {
            dft: (args) => args.input?.width,
            min: 1,
            max: (args) => args.input?.width,
            round: true
        },
        gui: {
            more: true,
            group: "scale",
            order: 0,
            width: 50
        }
    },
    height: {
        alias: "h",
        name: translate("commands.crop.args.height.name"),
        desc: translate("commands.crop.args.height.desc"),
        type: "pixels",
        required: false,
        settings: {
            dft: (args) => args.input?.height,
            min: 1,
            max: (args) => args.input?.height,
            round: true
        },
        gui: {
            more: true,
            group: "scale",
            order: 1,
            width: 50
        }
    }
};