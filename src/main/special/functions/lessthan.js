const { parseNumber } = require("#functions/arguments");
const { translate } = require("#functions/translate");

module.exports = {
    alias: ["less", "smallerthan", "smaller", "lowerthan", "lower", "ascending", "increasing"],
    description: translate("special.functions.lessthan.description"),
    func: (args) => {
        args = args.map(arg => parseNumber(arg));

        let isGreater = true;
        let lastNumber;

        for (let number of args) {
            isGreater &&= lastNumber == undefined || lastNumber < number;
            lastNumber = number;
        }

        return isGreater;
    }
};