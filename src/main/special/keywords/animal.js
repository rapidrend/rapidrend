const { randomChoice } = require("#functions/math");
const { translate } = require("#functions/translate");

const animals = translate("special.keywords.animal.list");

module.exports = {
    description: translate("special.keywords.animal.description"),
    values: animals,
    func: () => randomChoice(animals)
}