const { translate } = require("#functions/translate");

module.exports = {
    value: {
        desc: translate("special.functions.match.args.value.desc"),
        type: "string"
    },
    match: {
        desc: translate("special.functions.match.args.match.desc"),
        type: "string"
    },
    group: {
        desc: translate("special.functions.match.args.group.desc"),
        type: "number",
        settings: {
            round: true,
            min: 0,
            dft: 0
        }
    }
};