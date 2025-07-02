const { parseKeywords } = require("#functions/keywords");
const { randomChoice } = require("#functions/math");
const { translate } = require("#functions/translate");

module.exports = {
    alias: "choice",
    description: translate("special.functions.choice.description"),
    func: async (args, opts) => await parseKeywords(randomChoice(args), opts),
    raw: true
};