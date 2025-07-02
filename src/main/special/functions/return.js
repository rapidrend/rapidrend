const KeywordContent = require("#classes/KeywordContent");

const { translate } = require("#functions/translate");

module.exports = {
    description: translate("special.functions.return.description"),
    args: require("#args/keywords/return"),
    func: async (args, opts) => {
        opts.keywordStorage.returnValue = args.value;
        return new KeywordContent();
    }
};