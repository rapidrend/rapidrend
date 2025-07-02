const { translate } = require("#functions/translate");

module.exports = {
    description: translate("special.functions.match.description"),
    args: require("#args/keywords/match"),
    func: (args) => {
        const regexp = new RegExp(args.match);

        const match = args.value.match(regexp);

        return match ? match[args.group] : "";
    }
};