const { translate } = require("#functions/translate");

module.exports = {
    phrase: {
        desc: translate("special.functions.repeat.args.phrase.desc"),
        type: "string"
    },
    times: {
        desc: translate("special.functions.repeat.args.times.desc"),
        type: "number",
        settings: {
            dft: 0
        }
    },
    separator: {
        desc: translate("special.functions.repeat.args.separator.desc"),
        type: "string",
        settings: {
            dft: " "
        }
    }
};