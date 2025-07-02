const { parseBoolean } = require("#functions/arguments");
const { parseKeywords } = require("#functions/keywords");
const { translate } = require("#functions/translate");

module.exports = {
    description: translate("special.functions.while.description"),
    func: async (args, opts) => {
        const { while: condition, do: phrase, separator } = args;

        let evaluatedCondition = await parseKeywords(condition, opts);

        const repeated = [];
        while (parseBoolean(evaluatedCondition)) {
            const keywordResult = await parseKeywords(phrase, opts);
            repeated.push(keywordResult);

            evaluatedCondition = await parseKeywords(condition, opts);
        }

        return repeated.join(separator);
    },
    raw: true
};