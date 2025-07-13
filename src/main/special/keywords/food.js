const { randomChoice } = require("#functions/math");
const { translate } = require("#functions/translate");

const foods = translate("special.keywords.food.list");

module.exports = {
    description: translate("special.keywords.food.description"),
    values: foods,
    func: () => randomChoice(foods)
}