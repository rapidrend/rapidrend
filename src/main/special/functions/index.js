const functions = {
    arg: require("./arg"),
    declare: require("./declare"),
    rawdeclare: require("./rawdeclare"),
    undeclare: require("./undeclare"),
    and: require("./and"),
    or: require("./or"),
    not: require("./not"),
    equal: require("./equal"),
    notequal: require("./notequal"),
    greaterthan: require("./greaterthan"),
    lessthan: require("./lessthan"),
    math: require("./math"),
    random: require("./random"),
    choice: require("./choice"),
    if: require("./if"),
    while: require("./while"),
    dowhile: require("./dowhile"),
    repeat: require("./repeat"),
    rawrepeat: require("./rawrepeat"),
    command: require("./command"),
    trim: require("./trim"),
    lower: require("./lower"),
    upper: require("./upper"),
    substring: require("./substring"),
    match: require("./match"),
    replace: require("./replace"),
    setparentheses: require("./setparentheses"),
    setsplitter: require("./setseparator"),
    return: require("./return"),
    returnfile: require("./returnfile"),
};

for (let [funcName, func] of Object.entries(functions)) {
    func.key = funcName;
    if (func.alias) {
        if (!Array.isArray(func.alias)) func.alias = [func.alias];
        for (let alias of func.alias)
            functions[alias] = { ...func, isAlias: true };
    }
}

module.exports = functions;