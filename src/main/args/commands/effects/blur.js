const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.blur.args.input.name"),
        desc: translate("commands.blur.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    radius: {
        alias: "r",
        name: translate("commands.blur.args.radius.name"),
        desc: translate("commands.blur.args.radius.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 2,
            min: 0,
            max: 100
        },
        gui: {
            group: "blur",
            order: 0
        }
    },
    power: {
        alias: "p",
        name: translate("commands.blur.args.power.name"),
        desc: translate("commands.blur.args.power.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 2,
            min: 0,
            max: 100
        },
        gui: {
            group: "blur",
            order: 1
        }
    }
};