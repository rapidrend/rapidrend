const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.pixelate.args.input.name"),
        desc: translate("commands.pixelate.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    size: {
        alias: "s",
        name: translate("commands.pixelate.args.size.name"),
        desc: translate("commands.pixelate.args.size.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 5,
            min: 1,
            round: true
        }
    }
};