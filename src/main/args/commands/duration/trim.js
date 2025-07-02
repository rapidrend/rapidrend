const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.trim.args.input.name"),
        desc: translate("commands.trim.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["video", "audio", "gif"]
            }
        }
    },
    start: {
        name: translate("commands.trim.args.start.name"),
        desc: translate("commands.trim.args.start.desc"),
        type: "timestamp",
        required: false,
        settings: {
            dft: 0,
            min: 0,
            max: (args) => args.input?.duration
        },
        gui: {
            group: "time",
            order: 0
        }
    },
    end: {
        name: translate("commands.trim.args.end.name"),
        desc: translate("commands.trim.args.end.desc"),
        type: "timestamp",
        required: false,
        settings: {
            dft: (args) => args.input?.duration,
            min: 0,
            max: (args) => args.input?.duration
        },
        gui: {
            group: "time",
            order: 1
        }
    }
};