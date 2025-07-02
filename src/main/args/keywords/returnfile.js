const { translate } = require("#functions/translate");

module.exports = {
    file: {
        desc: translate("special.functions.returnfile.args.path.desc"),
        type: "file",
        required: true
    }
};