const { translate } = require("#functions/translate");

module.exports = {
    alias: ["parentheses", "par"],
    description: translate("special.functions.setparentheses.description"),
    args: require("#args/keywords/setparentheses"),
    func: (args, opts) => {
        opts.keywordStorage.parentheses = args.parentheses.split("");
        return "";
    }
};