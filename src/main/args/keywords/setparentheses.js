const { translate } = require("#functions/translate");

module.exports = {
    parentheses: {
        desc: translate("special.functions.setparentheses.args.parentheses.desc"),
        type: "string",
        required: true,
        settings: {
            length: 2
        }
    }
};