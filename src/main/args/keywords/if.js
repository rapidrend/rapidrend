const { translate } = require("#functions/translate");

module.exports = {
    condition: {
        desc: translate("special.functions.if.args.condition.desc"),
        type: "string"
    },

    then: {
        desc: translate("special.functions.if.args.then.desc"),
        type: "string",
        raw: true
    },

    else: {
        desc: translate("special.functions.if.args.else.desc"),
        type: "string",
        raw: true
    }
};