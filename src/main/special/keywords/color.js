const { randomChoice } = require("#functions/math");
const { translate } = require("#functions/translate");

const colors = translate("special.keywords.color.list");

module.exports = {
    description: translate("special.keywords.color.description"),
    values: colors,
    func: () => randomChoice(colors)
}