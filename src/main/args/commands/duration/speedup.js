const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.speedup.args.input.name"),
        desc: translate("commands.speedup.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["gif", "video", "audio"]
            }
        }
    },
    multiplier: {
        alias: "m",
        name: translate("commands.speedup.args.multiplier.name"),
        desc: translate("commands.speedup.args.multiplier.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 2,
            min: 1
        }
    }
};