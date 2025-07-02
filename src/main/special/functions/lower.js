const { translate } = require("#functions/translate");

module.exports = {
    description: translate("special.functions.lower.description"),
    args: require("#args/keywords/lower"),
    func: (args) => args.value.toLowerCase()
};