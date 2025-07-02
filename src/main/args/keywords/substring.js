const { translate } = require("#functions/translate");

module.exports = {
    value: {
        desc: translate("special.functions.substring.args.value.desc"),
        type: "string"
    },
    start: {
        desc: translate("special.functions.substring.args.value.desc"),
        type: "number",
        settings: {
            dft: 0,
            min: (args) => -args.value.length,
            max: (args) => args.value.length,
            round: true
        }
    },
    end: {
        desc: translate("special.functions.substring.args.value.desc"),
        type: "number",
        settings: {
            dft: (args) => args.value.length,
            min: (args) => -args.value.length,
            max: (args) => args.value.length,
            round: true
        }
    }
};