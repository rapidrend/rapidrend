const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.melt.args.input.name"),
        desc: translate("commands.melt.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["video", "gif"]
            }
        }
    },
    decay: {
        name: translate("commands.melt.args.decay.name"),
        desc: translate("commands.melt.args.decay.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 95,
            min: 0,
            max: 100
        },
        gui: {
            group: "melt",
            order: 0
        }
    },
    loop: {
        name: translate("commands.melt.args.loop.name"),
        desc: translate("commands.melt.args.loop.desc"),
        type: "boolean",
        required: false,
        settings: {
            dft: false
        },
        gui: {
            group: "melt",
            order: 1
        }
    }
};