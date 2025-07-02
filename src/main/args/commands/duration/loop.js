const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.loop.args.input.name"),
        desc: translate("commands.loop.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video", "audio"]
            }
        }
    },
    times: {
        name: translate("commands.loop.args.times.name"),
        desc: translate("commands.loop.args.times.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 2,
            min: 2,
            round: true
        }
    }
};