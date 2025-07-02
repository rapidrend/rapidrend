const { parseBoolean } = require("#functions/arguments");
const { parseKeywords } = require("#functions/keywords");
const { translate } = require("#functions/translate");

module.exports = {
    description: translate("special.functions.dowhile.description"),
    args: require("#args/keywords/dowhile"),
    func: async (args, opts) => {
        const { do: phrase, while: condition, separator } = args;

        let evaluatedCondition;

        const repeated = [];
        do {
            const keywordResult = await parseKeywords(phrase, opts);
            repeated.push(keywordResult);

            evaluatedCondition = await parseKeywords(condition, opts);
        } while (parseBoolean(evaluatedCondition));

        return repeated.join(separator);
    },
    raw: true
};