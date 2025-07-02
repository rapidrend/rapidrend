const { translate } = require("#functions/translate");

module.exports = {
    alias: ["noequal", "unequal", "notequals", "unequals", "noteq", "noeq", "uneq"],
    description: translate("special.functions.notequal.description"),
    func: (args) => {
        let isNotEqual = true;
        let lastPhrase;

        for (let phrase of args) {
            isEqual &&= lastPhrase == undefined || lastPhrase != phrase;
            lastPhrase = phrase;
        }

        return isNotEqual;
    }
};