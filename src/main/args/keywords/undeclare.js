const { translate } = require("#functions/translate");

module.exports = {
    name: {
        desc: translate("special.functions.undeclare.args.name.desc"),
        type: "string",
        required: true
    }
};