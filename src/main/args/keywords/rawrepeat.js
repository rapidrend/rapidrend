const { translate } = require("#functions/translate");

module.exports = {
    phrase: {
        desc: translate("special.functions.rawrepeat.args.phrase.desc"),
        type: "string",
        raw: true
    },
    times: {
        desc: translate("special.functions.rawrepeat.args.times.desc"),
        type: "number",
        settings: {
            dft: 0
        }
    },
    separator: {
        desc: translate("special.functions.rawrepeat.args.separator.desc"),
        type: "string",
        settings: {
            dft: " "
        }
    }
};