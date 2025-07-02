const { parseBoolean } = require("#functions/arguments");
const { parseKeywords } = require("#functions/keywords");
const { translate } = require("#functions/translate");

module.exports = {
    description: translate("special.functions.or.description"),
    func: async (args, opts) => {
        let and = "";

        for (let phrase of args) {
            const evaluatedPhrase = await parseKeywords(phrase, opts);
            if (!parseBoolean(evaluatedPhrase)) return "";
            else and = evaluatedPhrase;
        }

        return and;
    },
    raw: true
};