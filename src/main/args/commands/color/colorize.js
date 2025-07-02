const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.colorize.args.input.name"),
        desc: translate("commands.colorize.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    color: {
        alias: "rgb",
        name: translate("commands.colorize.args.color.name"),
        desc: translate("commands.colorize.args.color.desc"),
        type: "color",
        required: true,
        settings: {
            dft: { r: 255, g: 0, b: 0 }
        },
        gui: {
            group: "rgba",
            order: 0
        }
    },
    alpha: {
        alias: "a",
        name: translate("commands.colorize.args.alpha.name"),
        desc: translate("commands.colorize.args.alpha.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 255,
            min: 0,
            max: 255,
            round: true
        },
        gui: {
            group: "rgba",
            order: 1
        }
    },
    mode: {
        name: translate("commands.colorize.args.mode.name"),
        desc: translate("commands.colorize.args.mode.desc"),
        type: "string",
        required: false,
        settings: {
            allowed: {
                tint: translate("argValues.colorize.tint"),
                light: translate("argValues.colorize.light"),
                dark: translate("argValues.colorize.dark")
            },
            dft: "tint"
        },
        gui: {
            group: "mode",
            order: 0
        }
    },
    desaturate: {
        name: translate("commands.colorize.args.desaturate.name"),
        desc: translate("commands.colorize.args.desaturate.desc"),
        type: "boolean",
        required: false,
        settings: {
            dft: false
        },
        gui: {
            group: "mode",
            order: 1
        }
    }
};