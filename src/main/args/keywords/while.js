const { translate } = require("#functions/translate");

module.exports = {
    while: {
        desc: translate("special.functions.while.args.while.desc"),
        type: "string",
        raw: true
    },
    do: {
        desc: translate("special.functions.while.args.do.desc"),
        type: "string",
        raw: true
    },
    separator: {
        desc: translate("special.functions.while.args.separator.desc"),
        type: "string",
        settings: {
            dft: " "
        }
    }
};