const { replaceAsync } = require("#functions/async");
const { parseKeywords } = require("#functions/keywords");
const { translate } = require("#functions/translate");

module.exports = {
    description: translate("special.functions.replace.description"),
    args: require("#args/keywords/replace"),
    func: async (args, opts) => {
        const search = new RegExp(args.search);
        const replacer = async (match) => {
            const replaceOpts = { ...opts };
            replaceOpts.extraKeys._match = {
                func: () => {
                    return match;
                }
            };

            return await parseKeywords(args.replace, replaceOpts);
        };

        const replaced = await replaceAsync(args.value, search, replacer);
        args.value.match(regexp);

        return replaced;
    }
};