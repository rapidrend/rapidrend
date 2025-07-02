const { translate } = require("#functions/translate");

module.exports = {
    description: translate("special.functions.trim.description"),
    args: require("#args/keywords/trim"),
    func: (args) => args.value.trim()
};