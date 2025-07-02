const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.pixenlarge.args.input.name"),
        desc: translate("commands.pixenlarge.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    multiplier: {
        alias: "m",
        name: translate("commands.pixenlarge.args.multiplier.name"),
        desc: translate("commands.pixenlarge.args.multiplier.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 3,
            min: 2,
            max: 4,
            round: true
        },
        gui: {
            group: "scale",
            order: 0
        }
    },
    filter: {
        alias: "f",
        name: translate("commands.pixenlarge.args.filter.name"),
        desc: translate("commands.pixenlarge.args.filter.desc"),
        type: "string",
        required: false,
        settings: {
            allowed: {
                xbr: translate("argValues.pixFilter.xbr"),
                hqx: translate("argValues.pixFilter.hqx")
            },
            dft: "xbr"
        },
        gui: {
            group: "scale",
            order: 1
        }
    }
};