const { translate } = require("#functions/translate");

module.exports = {
    alias: "und",
    description: translate("special.functions.undeclare.description"),
    args: require("#args/keywords/undeclare"),
    func: async (args, opts) => {
        const declaredKeys = opts.keywordStorage.declaredKeys;
        const declaredName = `{${args.name}}`;

        delete declaredKeys[declaredName];

        return "";
    }
};