const { randomChoice } = require("#functions/math");
const { translate } = require("#functions/translate");

const countries = translate("special.keywords.country.list");

module.exports = {
    description: translate("special.keywords.country.description"),
    values: countries,
    func: () => randomChoice(countries)
}