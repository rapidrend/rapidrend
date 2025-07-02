const { translate } = require("#functions/translate");

module.exports = {
    separator: {
        desc: translate("special.functions.setseparator.args.separator.desc"),
        type: "string",
        required: true,
        settings: {
            length: 1
        }
    }
};