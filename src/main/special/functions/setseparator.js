const { translate } = require("#functions/translate");

module.exports = {
    alias: ["separator", "sep", "setsep", "setsplitter", "splitter", "spltr"],
    description: translate("special.functions.setsplitter.description"),
    args: require("#args/keywords/setseparator"),
    func: (args, opts) => {
        opts.keywordStorage.separator = args.separator;
        return "";
    }
};