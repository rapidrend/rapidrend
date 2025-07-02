const FileInfo = require("#classes/FileInfo");

const { translate } = require("#functions/translate");

module.exports = {
    description: translate("special.functions.arg.description"),
    args: require("#args/keywords/arg"),
    func: async (args, opts) => {
        let arg = opts.args[args.name];

        if (arg instanceof FileInfo) arg = arg.path;

        return arg;
    }
};