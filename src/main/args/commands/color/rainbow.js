const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.rainbow.args.input.name"),
        desc: translate("commands.rainbow.args.input.desc"),
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
        name: translate("commands.rainbow.args.duration.name"),
        desc: translate("commands.rainbow.args.duration.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 1,
            min: 0.1
        }
    }
};