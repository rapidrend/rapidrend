const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.spin.args.input.name"),
        desc: translate("commands.spin.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    duration: {
        alias: ["d", "t"],
        name: translate("commands.spin.args.duration.name"),
        desc: translate("commands.spin.args.duration.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 1,
            min: 0.1
        },
        gui: {
            group: "spin",
            order: 0
        }
    },
    cut: {
        name: translate("commands.spin.args.cut.name"),
        desc: translate("commands.spin.args.cut.desc"),
        type: "boolean",
        required: false,
        settings: {
            dft: false
        },
        gui: {
            group: "spin",
            order: 1
        }
    }
};