const { translate } = require("#functions/translate");

module.exports = {
    do: {
        desc: translate("special.functions.dowhile.args.do.desc"),
        type: "string",
        raw: true
    },
    while: {
        desc: translate("special.functions.dowhile.args.while.desc"),
        type: "string",
        raw: true
    },
    separator: {
        desc: translate("special.functions.dowhile.args.separator.desc"),
        type: "string",
        settings: {
            dft: " "
        }
    }
};