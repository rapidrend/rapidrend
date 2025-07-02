const { translate } = require("#functions/translate");

module.exports = {
    description: translate("special.functions.repeat.description"),
    args: require("#args/keywords/repeat"),
    func: async function (args) {
        const { phrase, times, separator } = args;
        
        const repeated = [];
        for (let i = 0; i < times; i++)
            repeated.push(phrase);

        return repeated.join(separator);
    }
};