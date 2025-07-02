const KeywordContent = require("#classes/KeywordContent");

const { addDefaultArgs, validateArg } = require("./arguments");
const { regexClean, infoPost } = require("./general")

async function parseKeywords(string, {
    args = {},
    keywordStorage = {
        declaredKeys: {},
        declaredFuncs: {},
        parentheses: ["(", ")"],
        separator: "|"
    },
    extraKeys = {},
    extraFuncs = {},
    declaredOnly = false
} = {}) {
    if (typeof string != "string") return string;

    const special = app.special;

    try {
        const declaredKeys = keywordStorage.declaredKeys
            = keywordStorage.declaredKeys ?? {};

        const declaredFuncs = keywordStorage.declaredFuncs
            = keywordStorage.declaredFuncs ?? {};

        let taskKeys;
        let taskFuncs;

        let keywordData;

        function setDeclared() {
            taskKeys = declaredOnly ? { ...declaredKeys } : { ...extraKeys, ...declaredKeys };
            taskFuncs = declaredOnly ? { ...declaredFuncs } : { ...extraFuncs, ...declaredFuncs };
        }

        function processChange(pattern, stringChange) {
            if (stringChange instanceof KeywordContent)
                return stringChange.text;

            return string.replace(pattern, String(stringChange).replace(/\$&/g, "$\\&")).trim();
        }

        setDeclared();

        while ((keywordData = getKeywords(string, {
            extraKeys: taskKeys,
            extraFuncs: taskFuncs,
            parentheses: keywordStorage.parentheses ?? ["(", ")"],
            declaredOnly
        })) && keywordStorage.returnValue === undefined) {
            const parentheses = keywordStorage.parentheses
                = keywordStorage.parentheses ?? ["(", ")"];
        
            const separator = keywordStorage.separator
                = keywordStorage.separator ?? "|";

            const opts = { args, extraKeys: taskKeys, extraFuncs: taskFuncs, keywordStorage };

            let stringChange;

            infoPost(`Found ${keywordData.type}: ${keywordData.name}`);

            try {
                switch (keywordData.type) {
                    case "key": {
                        let keyName = keywordData.name;

                        let keyTrim = keyName;
                        let key = special.keywords[keyName] || taskKeys[keyName];

                        if (key === undefined) {
                            keyTrim = keyName.substring(1);
                            key = special.keywords[keyTrim] || taskKeys[keyTrim];
                        }

                        if (key) {
                            const doEscape = keyTrim !== keyName;
                            const result = await key.func(opts);
                            stringChange = doEscape ? await escapeKeywordResult(result) : result;
                        } else
                            stringChange = "";

                        string = processChange(keywordData.name, stringChange);
                        break;
                    }

                    case "func": {
                        const { name: funcName, args } = keywordData;

                        let funcTrim = funcName;
                        let func = special.functions[funcName] || taskFuncs[funcName];

                        if (func === undefined) {
                            funcTrim = funcName.slice(0, -1);
                            func = special.functions[funcTrim] || taskFuncs[funcTrim];
                        }

                        if (func) {
                            let processedArgs = args.replace(/\\\)/g, ")");
                            if (!func.raw) string = string.replace(args, processedArgs);
                            const doEscape = funcTrim !== funcName;

                            processedArgs = splitKeywords(processedArgs, {
                                extraFuncs: taskFuncs,
                                args: func.args ? Object.keys(func.args).length : Infinity,
                                parentheses, separator, declaredOnly
                            });

                            processedArgs = await parseKeywordArgs(processedArgs, func, opts);

                            const result = await func.func(processedArgs, opts);
                            stringChange = doEscape ? await escapeKeywordResult(result) : result;
                        } else
                            stringChange = "";

                        string = processChange(`${funcName}${parentheses[0]}${args}${parentheses[1]}`, stringChange);
                        break;
                    }
                }
            } catch (err) {
                console.error("Keyword processing error:", err);
                string = processChange(
                    keywordData.type === "func" ? `${keywordData.name}${parentheses[0]}${keywordData.args}${parentheses[1]}` : keywordData.name, ""
                );
            }

            infoPost(`Keyword change: ${stringChange}`);
            infoPost(`New keyword string content: ${string}`);
            setDeclared();
        }

        if (keywordStorage.returnValue != undefined) {
            string = keywordStorage.returnValue;
            delete keywordStorage.returnValue;
        }

        return string;
    } catch (err) {
        console.error("parseKeywords error:", e);
        throw err;
    }
}

async function parseKeywordArgs(argsArr, keyFunction, opts) {
    if (!keyFunction.args) return argsArr;

    const args = {};
    const argEntries = Object.entries(keyFunction.args);
    const keywordStorage = {};

    for (let i = 0; i < argsArr.length; i++) {
        const arg = argsArr[i];
        const [argName, argData] = argEntries[i];
        if (argData == undefined) continue;

        const argValue = await validateArg(arg, argData, args, {
            keywordMode: true,
            keywordStorage,
            keywordOpts: opts
        });
        
        if (argValue === undefined) continue;

        args[argName] = argValue;
    }

    await addDefaultArgs(args, keyFunction, args, { keywordMode: true });

    return args;
}

function getKeywords(string, {
    extraKeys = {},
    extraFuncs = {},
    declaredOnly = false,
    parentheses = ["(", ")"]
} = {}) {
    if (typeof string != "string") return;

    const special = app.special;

    const parGoal = [];
    const probIndexes = [];

    let parIndex = -1;
    let firstParIndex = -1;
    let lastParIndex = -1;
    let rawParIndex = -1;

    let rawMatch = null;
    let rawRequirement = 0;

    let keywordIndex = -1;

    const keyList = declaredOnly ? { ...extraKeys } : { ...extraKeys, ...special.keywords };
    const funcList = declaredOnly ? { ...extraFuncs } : { ...extraFuncs, ...special.functions };
    const probFuncList = {};

    const regexCache = new Map();

    function getRegex(key, type) {
        const cacheKey = `${type}_${key}`;
        if (!regexCache.has(cacheKey)) {
            const pattern = type === "func"
                ? `${regexClean(key)}(?!\\\\)_?${regexClean(parentheses[0])}`
                : `(?<!\\\\)_?(?<!\\\\)${regexClean(key)}`;
            regexCache.set(cacheKey, new RegExp(pattern, "g"));
        }
        return regexCache.get(cacheKey);
    }

    for (const k in keyList)
        if (keyList[k]?.probable?.funcs)
            Object.assign(probFuncList, keyList[k].probable.funcs);

    for (const f in funcList)
        if (funcList[f]?.probable?.funcs)
            Object.assign(probFuncList, funcList[f].probable.funcs);

    const keywords = Object.keys(keyList)
        .sort((a, b) => b.length - a.length)
        .filter(key => getRegex(key, "key").test(string));

    const functions = Object.keys(funcList)
        .sort((a, b) => b.length - a.length)
        .filter(func => getRegex(func, "func").test(string));

    const probFunctions = Object.keys(probFuncList)
        .sort((a, b) => b.length - a.length)
        .filter(pfunc => getRegex(pfunc, "func").test(string));

    const keyFirstLetters = [...new Set(keywords.map(key => key[0]))];

    if (keywords.length === 0 && functions.length === 0) return;

    for (let i = 0; i < string.length; i++) {
        const char = string[i];

        if ((functions.length > 0 || probFunctions.length > 0) && parentheses.includes(char)) {
            if (char === parentheses[0]) {
                const substr = string.substring(0, i);
                const currentProbFunctions = parGoal.length <= 0 ? probFunctions : [""];

                const functionMatch = matchLongest(substr, functions, "func");
                const probableFuncMatch = matchLongest(substr, currentProbFunctions, "func");

                if (functionMatch) {
                    parIndex++;
                    firstParIndex = i;

                    if (!rawMatch) {
                        const func = funcList[functionMatch] || funcList[functionMatch.slice(0, -1)];

                        if (func?.raw) {
                            rawParIndex = i;
                            rawRequirement++;
                            rawMatch = functionMatch;
                        }

                        if (func?.parentheses)
                            parGoal.push(parIndex - 1);
                    } else {
                        rawRequirement++;
                    }
                } else if (probableFuncMatch === "") {
                    parIndex++;
                    probIndexes.push(parIndex);
                }
            }

            if (char === parentheses[1] && string[i - 1] !== "\\") {
                const functionMatch = matchLongest(string.substring(0, firstParIndex), functions, "func");

                if (functionMatch) {
                    const parGoalIndex = parGoal.indexOf(parIndex);
                    if (parGoalIndex !== -1)
                        parGoal.splice(parGoalIndex, 1);

                    const probIndex = probIndexes.indexOf(parIndex);
                    if (probIndex !== -1)
                        probIndexes.splice(probIndex, 1);
                    else {
                        if (!rawMatch) {
                            firstParIndex++;
                            return {
                                name: functionMatch,
                                args: string.substring(firstParIndex, i),
                                type: "func"
                            };
                        }

                        rawRequirement--;
                        lastParIndex = i;

                        if (rawRequirement <= 0) {
                            rawParIndex++;
                            return {
                                name: rawMatch,
                                args: string.substring(rawParIndex, i),
                                type: "func"
                            };
                        }
                    }

                    parIndex--;
                }
            }
        }

        if (keywords.length > 0 && keyFirstLetters.includes(char)) {
            const keywordMatch = matchLongest(string.substring(i), keywords, "key");
            if (keywordMatch) {
                keywordIndex = i;

                if (rawRequirement <= 0) {
                    return {
                        name: keywordMatch,
                        type: "key"
                    };
                }
            }
        }
    }

    if (lastParIndex > -1) {
        const functionMatch = matchLongest(string.substring(0, firstParIndex), functions, "func");
        firstParIndex++;

        return {
            name: functionMatch,
            args: string.substring(firstParIndex, lastParIndex),
            type: "func"
        };
    }

    if (keywordIndex > -1) {
        const keywordMatch = matchLongest(string.substring(keywordIndex), keywords, "key");

        return {
            name: keywordMatch,
            type: "key"
        };
    }

    return;
}

function splitKeywords(string, {
    extraFuncs = {},
    args = Infinity,
    parentheses = ["(", ")"],
    separator = "|",
    declaredOnly = false,
    noValidation = false
} = {}) {
    const special = app.special;

    const splittedKeywords = [];

    const parGoal = [];

    let separatorFound = 0;
    let lastSeparatorIndex = 0;

    let parRequired = 0;
    let firstParIndex = -1;

    const funcList = declaredOnly ? { ...extraFuncs } : { ...extraFuncs, ...special.functions };
    const probFuncList = {};

    for (const f in funcList)
        if (funcList[f]?.probable?.funcs)
            Object.assign(probFuncList, funcList[f].probable.funcs);

    const funcRegexCache = new Map();

    function getFuncRegex(func) {
        if (!funcRegexCache.has(func))
            funcRegexCache.set(func, new RegExp(`${regexClean(func)}(?!\\\\)_?${regexClean(parentheses[0])}`, "g"));

        return funcRegexCache.get(func);
    }

    const allFunctions = [...Object.keys(funcList), ...Object.keys(probFuncList)]
        .sort((a, b) => b.length - a.length)
        .filter(afunc => getFuncRegex(afunc).test(string));

    for (let i = 0; i < string.length; i++) {
        const char = string[i];

        switch (char) {
            case parentheses[0]: {
                if (allFunctions.length > 0) {
                    const currentFunctions = parGoal.length <= 0 ? allFunctions : [""];
                    const functionMatch = matchLongest(string.substring(0, i), currentFunctions, "func");

                    if (functionMatch && string[i - 1] !== "\\") {
                        firstParIndex = i;
                        parRequired++;

                        const func = funcList[functionMatch[0]];
                        if (func?.parentheses)
                            parGoal.push(parRequired - 1);
                    }
                }
                break;
            }

            case separator: {
                if (parRequired <= 0 && string[i - 1] !== "\\") {
                    const trimLeft = 0 + Number(string[i - 1].match(/\s/) != undefined);
                    const trimRight = 1 + Number(string[i + 1].match(/\s/) != undefined);

                    splittedKeywords.push(string.substring(lastSeparatorIndex, i - trimLeft));
                    lastSeparatorIndex = i + trimRight;
                    separatorFound++;

                    if (separatorFound === args - 1) {
                        splittedKeywords.push(string.substring(lastSeparatorIndex));
                        return splittedKeywords.map(
                            val => val.replace(new RegExp(`\\\\${regexClean(separator)}`, "g"), separator)
                        );
                    }
                }
                break;
            }

            case parentheses[1]: {
                if (allFunctions.length > 0) {
                    const currentFunctions = parGoal.length <= 0 ? allFunctions : [""];
                    const functionMatch = matchLongest(string.substring(0, firstParIndex), currentFunctions, "func");

                    if (functionMatch && string[i - 1] !== "\\") {
                        const pgoalIndex = parGoal.indexOf(parRequired);
                        if (pgoalIndex !== -1)
                            parGoal.splice(pgoalIndex, 1);

                        parRequired--;
                    }
                }
                break;
            }
        }
    }

    if (string.substring(lastSeparatorIndex))
        splittedKeywords.push(string.substring(lastSeparatorIndex));

    return splittedKeywords.map(
        val => val.replace(new RegExp(`\\\\${regexClean(separator)}`, "g"), separator)
    );
}

function matchLongest(str, keywords, type) {
    let longest = "";
    let matched = false;

    if (keywords.length <= 0) return longest;

    for (let i in keywords) {
        const match = type == "key"
            ? str.match(new RegExp(`^(?<!\\\\)_?(?<!\\\\)${regexClean(keywords[i])}`))
            : str.match(new RegExp(`${regexClean(keywords[i])}_?$`));

        if (match?.[0]?.length >= longest.length) {
            matched = true;
            longest = match[0];
        }
    }

    return matched && longest;
}

function parenthesesMatch(string, {
    parentheses = ["(", ")"]
}) {
    let parIndex = 0;
    let firstParIndex = -1;
    let lastParIndex = -1;

    for (let i = 0; i < string.length; i++) {
        const char = string[i];

        switch (char) {
            case parentheses[0]: {
                if (parIndex <= 0) firstParIndex = i;
                parIndex++;
                break;
            }

            case parentheses[1]: {
                if (string[i - 1] !== "\\") {
                    parIndex--;
                    lastParIndex = i + 1;

                    if (parIndex <= 0)
                        return string.substring(firstParIndex, i + 1);
                }
                break;
            }
        }
    }

    if (lastParIndex > -1) {
        firstParIndex++;
        return string.substring(firstParIndex, lastParIndex);
    }

    return null;
}

function escapeKeywordResult(string) {
    if (typeof string !== "string") return string;
    return string.replace(/(?<!\\)([()\[\]{}_"])/g, "\\$1");
}

module.exports = {
    parseKeywords,
    getKeywords,
    splitKeywords,
    parenthesesMatch
}