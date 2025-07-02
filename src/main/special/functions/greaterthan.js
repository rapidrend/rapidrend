const { parseNumber } = require("#functions/arguments");
const { translate } = require("#functions/translate");

module.exports = {
    alias: ["greater", "morethan", "more", "biggerthan", "bigger", "higherthan", "higher", "descending", "decreasing"],
    description: translate("special.functions.greaterthan.description"),
    func: (args) => {
        args = args.map(arg => parseNumber(arg));

        let isGreater = true;
        let lastNumber;

        for (let number of args) {
            isGreater &&= lastNumber == undefined || lastNumber > number;
            lastNumber = number;
        }

        return isGreater;
    }
};