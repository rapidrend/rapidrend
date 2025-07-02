const { translate } = require("#functions/translate");
const { parseKeywords } = require("#functions/keywords");

module.exports = {
    name: translate("commands.evalkeywords.name"),
    description: translate("commands.evalkeywords.description"),
    category: translate("categories.local"),
    args: require("#args/commands/local/evalkeywords"),
    forLocalCommand: true,

    async execute(args) {
        return await parseKeywords(args.phrase);
    }
};
