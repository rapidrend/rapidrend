const { randomNumber } = require("#functions/math");
const { translate } = require("#functions/translate");

module.exports = {
    alias: "rand",
    description: translate("special.functions.random.description"),
    args: require("#args/keywords/random"),
    func: (args) => randomNumber(...Object.values(args))
};