const { translate } = require("#functions/translate");

module.exports = {
    alias: ["equals", "eq"],
    description: translate("special.functions.equal.description"),
    func: (args) => {
        let isEqual = true;
        let lastPhrase;

        for (let phrase of args) {
            isEqual &&= lastPhrase == undefined || lastPhrase == phrase;
            lastPhrase = phrase;
        }

        return isEqual;
    }
};