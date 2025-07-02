const { translate } = require("#functions/translate");

module.exports = {
    phrase: {
        name: translate("commands.evalkeywords.args.phrase.name"),
        desc: translate("commands.evalkeywords.args.phrase.desc"),
        type: "string",
        required: true,
        raw: true,
        settings: {
            dft: ""
        },
        gui: {
            multiline: true,
            mono: true,
            tab: false,
            extraHeight: 100
        }
    }
};