const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.blob.args.input.name"),
        desc: translate("commands.blob.args.input.desc"),
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
        name: translate("commands.blob.args.duration.name"),
        desc: translate("commands.blob.args.duration.desc"),
        type: "number",
        required: false,

        settings: {
            dft: 0.5,

            min: 0.05
        }
    }
};