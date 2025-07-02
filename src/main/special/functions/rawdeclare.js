const { parseKeywords } = require("#functions/keywords");
const { translate } = require("#functions/translate");

module.exports = {
    alias: "rawd",
    description: translate("special.functions.rawdeclare.description"),
    args: require("#args/keywords/rawdeclare"),
    func: async (args, opts) => {
        const declaredKeys = opts.keywordStorage.declaredKeys;
        const declaredName = `{${args.name}}`;

        declaredKeys[declaredName] = {
            func: async () => {
                return await parseKeywords(args.value, opts);
            }
        };

        return "";
    },
    raw: true
};