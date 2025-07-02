const { parseBoolean } = require("#functions/arguments");
const { parseKeywords } = require("#functions/keywords");
const { translate } = require("#functions/translate");

module.exports = {
    description: translate("special.functions.and.description"),
    func: async (args, opts) => {
        for (let phrase of args) {
            const evaluatedPhrase = await parseKeywords(phrase, opts);
            if (parseBoolean(evaluatedPhrase)) return evaluatedPhrase;
        }

        return "";
    },
    raw: true
};