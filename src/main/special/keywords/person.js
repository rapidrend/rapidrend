const { randomChoice } = require("#functions/math");
const { translate } = require("#functions/translate");

const people = translate("special.keywords.person.list");

module.exports = {
    description: translate("special.keywords.person.description"),
    values: people,
    func: () => randomChoice(people)
}