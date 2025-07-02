const { translate } = require("#functions/translate");

module.exports = {
    name: {
        desc: translate("special.functions.command.args.name.desc"),
        type: "string",
        required: true
    },
    args: {
        desc: translate("special.functions.command.args.args.desc"),
        type: "string",
        settings: {
            default: ""
        }
    }
};