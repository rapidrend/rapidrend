const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.bouncy.args.input.name"),
        desc: translate("commands.bouncy.args.input.desc"),
        type: "file",
        required: true,

        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    }
};