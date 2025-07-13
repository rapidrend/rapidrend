const keywords = {
    _animal: require("./animal"),
    _country: require("./country"),
    _color: require("./color"),
    _person: require("./person"),
    _food: require("./food")
};

for (let [keyName, key] of Object.entries(keywords)) {
    key.key = keyName;
    if (key.alias) {
        if (!Array.isArray(key.alias)) key.alias = [key.alias];
        for (let alias of key.alias)
            keywords[alias] = { ...key, isAlias: true };
    }
}

module.exports = keywords;