const keywords = {
    _animal: require("./animal")
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