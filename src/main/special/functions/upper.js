const { translate } = require("#functions/translate");

module.exports = {
    description: translate("special.functions.upper.description"),
    args: require("#args/keywords/upper"),
    func: (args) => args.value.toUpperCase()
};