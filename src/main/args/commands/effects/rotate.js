const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.rotate.args.input.name"),
        desc: translate("commands.rotate.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    degrees: {
        alias: "d",
        name: translate("commands.rotate.args.degrees.name"),
        desc: translate("commands.rotate.args.degrees.desc"),
        type: "number",
        required: true,
        settings: {
            dft: 0,
            min: -360,
            max: 360
        },
        gui: {
            group: "rotate",
            order: 0,
            suffix: "º"
        }
    },
    cut: {
        name: translate("commands.rotate.args.cut.name"),
        desc: translate("commands.rotate.args.cut.desc"),
        type: "boolean",
        required: false,
        settings: {
            dft: false
        },
        gui: {
            group: "rotate",
            order: 1
        }
    }
};