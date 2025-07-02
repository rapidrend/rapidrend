const { evaluate } = require("mathjs");
const { translate } = require("#functions/translate");

module.exports = {
    alias: ["calc", "calculate"],
    description: translate("special.functions.math.description"),
    args: require("#args/keywords/math"),
    func: (args) => {
        try {
            return evaluate(args.expression);
        } catch (err) {
            return NaN;
        }
    }
};