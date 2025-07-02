const { translate } = require("#functions/translate");

module.exports = {
    min: {
        desc: translate("special.functions.random.args.min.desc"),
        type: "number",
        settings: {
            default: null
        }
    },
    max: {
        desc: translate("special.functions.random.args.max.desc"),
        type: "number",
        settings: {
            default: null
        }
    }
};