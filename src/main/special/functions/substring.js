const { translate } = require("#functions/translate");

module.exports = {
    alias: ["sub", "substr", "slice"],
    description: translate("special.functions.substring.description"),
    args: require("#args/keywords/substring"),
    func: (args) => args.value.slice(args.start, args.end)
};