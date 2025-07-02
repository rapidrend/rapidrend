const { translate } = require("#functions/translate");

module.exports = {
    alias: ["n"],
    description: translate("special.functions.not.description"),
    args: require("#args/keywords/not"),
    func: (args) => !args.value
};