const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.boomerang.args.input.name"),
        desc: translate("commands.boomerang.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["video", "gif", "audio"]
            }
        }
    }
};