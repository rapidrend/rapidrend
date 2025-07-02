const { translate } = require("#functions/translate");

module.exports = {
    name: {
        desc: translate("special.functions.declare.args.name.desc"),
        type: "string",
        required: true
    },

    value: {
        desc: translate("special.functions.declare.args.value.desc"),
        type: "string"
    }
};