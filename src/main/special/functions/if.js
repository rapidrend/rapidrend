const { parseBoolean } = require("#functions/arguments");
const { parseKeywords } = require("#functions/keywords");
const { translate } = require("#functions/translate");

module.exports = {
    description: translate("special.functions.if.description"),
    args: require("#args/keywords/if"),
    func: async (args, opts) => {
        let value;

        if (parseBoolean(args.condition))
            value = args.then;
        else
            value = args.else;
        
        return await parseKeywords(value, opts);
    },
    raw: true
};