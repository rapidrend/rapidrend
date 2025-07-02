const { parseKeywords } = require("#functions/keywords");
const { translate } = require("#functions/translate");

module.exports = {
    alias: "for",
    description: translate("special.functions.rawrepeat.description"),
    args: require("#args/keywords/rawrepeat"),
    func: async function (args, opts) {
        const { phrase, times, separator } = args;
        
        const repeated = [];
        for (let i = 0; i < times; i++) {
            const keywordResult = await parseKeywords(phrase, opts);
            repeated.push(keywordResult);
        }

        return repeated.join(separator);
    },
    raw: true
};