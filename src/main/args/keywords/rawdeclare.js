const { translate } = require("#functions/translate");

module.exports = {
    name: {
        desc: translate("special.functions.rawdeclare.args.name.desc"),
        type: "string",
        required: true
    },

    value: {
        desc: translate("special.functions.rawdeclare.args.value.desc"),
        type: "string",
        raw: true
    }
};