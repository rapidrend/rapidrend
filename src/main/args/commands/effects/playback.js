const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.playback.args.input.name"),
        desc: translate("commands.playback.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["gif", "video", "audio"]
            }
        }
    },
    mode: {
        name: translate("commands.playback.args.mode.name"),
        desc: translate("commands.playback.args.mode.desc"),
        type: "string",
        required: false,
        settings: {
            allowed: {
                reverse: translate("argValues.playback.reverse"),
                boomerang: translate("argValues.playback.boomerang"),
                reverseBoomerang: translate("argValues.playback.reverseBoomerang")
            },
            dft: "reverse"
        }
    }
};