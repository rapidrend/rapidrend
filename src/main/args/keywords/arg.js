const { translate } = require("#functions/translate");

module.exports = {
    name: {
        desc: translate("special.functions.arg.args.name.desc"),
        type: "string",
        required: true,
        settings: {
            allowed: (_args, opts) => Object.keys(opts.args)
        }
    }
};