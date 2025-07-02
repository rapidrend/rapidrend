const { translate } = require("#functions/translate");

module.exports = {
    value: {
        desc: translate("special.functions.replace.args.value.desc"),
        type: "string"
    },
    search: {
        desc: translate("special.functions.replace.args.search.desc"),
        type: "string"
    },
    replace: {
        desc: translate("special.functions.replace.args.replace.desc"),
        type: "string"
    }
};