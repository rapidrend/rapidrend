const FileEmbed = require("#classes/FileEmbed");
const KeywordContent = require("#classes/KeywordContent");

const { translate } = require("#functions/translate");

module.exports = {
    description: translate("special.functions.returnfile.description"),
    args: require("#args/keywords/returnfile"),
    func: async (args, opts) => {
        opts.keywordStorage.returnValue = new FileEmbed(args.file.path);
        return new KeywordContent();
    }
};