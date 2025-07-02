const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.offset.args.input.name"),
        desc: translate("commands.offset.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["video", "audio", "gif"]
            }
        }
    },
    timestamp: {
        alias: "t",
        name: translate("commands.offset.args.timestamp.name"),
        desc: translate("commands.offset.args.timestamp.desc"),
        type: "timestamp",
        required: true,
        settings: {
            min: 0,
            max: (args) => args.input?.duration
        },
        gui: {
            group: "time",
            order: 0
        }
    }
};