const { translate } = require("#functions/translate");

module.exports = {
    alias: "d",
    description: translate("special.functions.declare.description"),
    args: require("#args/keywords/declare"),
    func: async (args, opts) => {
        const declaredKeys = opts.keywordStorage.declaredKeys;
        const declaredName = `{${args.name}}`;

        declaredKeys[declaredName] = {
            func: () => {
                return args.value;
            }
        };

        return "";
    }
};