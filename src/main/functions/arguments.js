const { validateFile } = require("./media");
const { chunkArray } = require("./general");
const { translate } = require("./translate");

const getFonts = require("#utils/fontFetcher");

function getArgOption(args, name, {
    dft = undefined, n = 1, splice = false, join = true, func = (opt) => opt, stopMatch = []
} = {}) {
    if (!Array.isArray(name)) name = [name];

    const optionIndex = args.findIndex(a => name.indexOf(a) > -1);

    if (optionIndex > -1) {
        let option = [];
        let spliceCount = 0

        for (let i = 1; i <= Math.min(n, args.length - optionIndex - 1); i++) {
            if (stopMatch.includes(args[optionIndex + i])) break;

            spliceCount++;
            option.push(func(args[optionIndex + i], i));
        }

        if (splice) args.splice(optionIndex, spliceCount + 1);
        if (join) option = option.join(" ");

        return n == 0 ? true : isNaN(Number(option)) ? option : Number(option);
    }

    return n == 0 ? false : dft;
}

function parseBoolean(val) {
    try {
        return JSON.parse(String(val));
    } catch {
        return !!val;
    }
}

function parseNumber(val, {
    dft = undefined, min = -Infinity, max = Infinity, round = false
} = {}) {
    if (val == undefined || val === "") val = dft !== undefined ? dft : 0;
    if (typeof val != "number") val = Number(val);

    val = Math.clamp(val, min, max);
    if (round) val = Math.round(val);

    return isNaN(val) ? dft : val ?? dft;
}

function parseString(val, {
    allowed = [], dft = undefined, lower = false, upper = false,
    trim = false, length = undefined
} = {}) {
    if (val == undefined) val = dft !== undefined ? dft : "";
    if (!Array.isArray(allowed)) allowed = Object.keys(allowed);

    if (length) {
        val = val.substring(0, length);
        if (val.length < length) throw `String too short.`;
    }

    let query = upper ? val.toUpperCase()
        : lower ? val.toLowerCase()
            : val;

    if (trim) query = query.trim();

    return allowed && allowed.length > 0 ? allowed.find(q => q == query) || dft : val;
}

function parsePixels(val, {
    dft = undefined, min = -Infinity, max = Infinity, base = undefined
} = {}) {
    if (val == undefined) val = dft !== undefined ? dft : 0;
    if (typeof val != "string") val = String(val);

    if (val.endsWith("%")) {
        const percentage = Number(val.slice(0, -1)) * 0.01;
        val = percentage * (base ?? max);
    }

    return parseNumber(val, { dft, min, max, round: true });
}

function parseTimestamp(val, {
    dft = undefined, min = -Infinity, max = Infinity
} = {}) {
    if (val == undefined) val = dft !== undefined ? dft : 0;
    if (typeof val != "string") val = String(val);

    let total = 0;
    val = val.split(":").reverse();
    val.splice(3);

    for (let i = 0; i < val.length; i++) {
        val[i] = parseNumber(Number(val[i]) * (Math.pow(60, i)), {
            min: 0,
            dft: 0
        });
        total += val[i];
    }

    return parseNumber(total, { dft, min, max });
}

function parseColor(val, {
    dft = undefined, allowAlpha = false
} = {}) {
    if (val == undefined) val = dft !== undefined ? dft : { r: 0, g: 0, b: 0 };

    if (typeof val === 'object' && val.r !== undefined && val.g !== undefined && val.b !== undefined) {
        return {
            r: Math.min(255, Math.max(0, val.r)),
            g: Math.min(255, Math.max(0, val.g)),
            b: Math.min(255, Math.max(0, val.b))
        };
    }

    if (typeof val === 'string') {
        const namedColors = {
            'black': { r: 0, g: 0, b: 0 },
            'white': { r: 255, g: 255, b: 255 }
        };

        const lowerColor = val.toLowerCase().trim();
        if (namedColors[lowerColor]) {
            return namedColors[lowerColor];
        }

        const hexRegex = /^#?([0-9a-f]{3,8})$/i;
        const hexMatch = val.match(hexRegex);
        if (hexMatch) {
            let hex = hexMatch[1];
            if (hex.length === 3 || hex.length === 4) {
                hex = hex.split('').map(c => c + c).join('');
            }
            if (hex.length >= 6) {
                return {
                    r: parseInt(hex.substring(0, 2), 16),
                    g: parseInt(hex.substring(2, 4), 16),
                    b: parseInt(hex.substring(4, 6), 16)
                };
            }
        }

        const rgbRegex = /^(?:rgba?\()?\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)?$/i;
        const rgbMatch = val.match(rgbRegex);
        if (rgbMatch) {
            return {
                r: Math.min(255, parseInt(rgbMatch[1], 10)),
                g: Math.min(255, parseInt(rgbMatch[2], 10)),
                b: Math.min(255, parseInt(rgbMatch[3], 10))
            };
        }
    }

    return dft || { r: 0, g: 0, b: 0 };
}

async function parseFont(val, fieldMode) {
    if (!val) return null;

    const fonts = await getFonts();

    const cleanFontName = (str) => str && str.replace(/[^a-zA-Z0-9]/, "").toLowerCase();

    const fontEntries = Object.entries(fonts);
    const fontEntry = fontEntries.find(
        ([family, styles]) => cleanFontName(styles.name) == cleanFontName(val)
            || cleanFontName(family) == cleanFontName(val)
    );

    if (!fontEntry) return null;

    const [fontName, fontStyles] = fontEntry;

    const fontStyle = fontStyles.find(
        f => cleanFontName(f.name) == cleanFontName(val)
            || (f.style == "Normal" && f.weight == 400 && f.stretch == "Normal")
    ) ?? fontStyles[0];

    return (fieldMode ? fontName : fontStyle?.name) ?? null;
}

async function parseFunctionSettings(settings, args, opts) {
    for (let s in settings) {
        const setting = settings[s];
        if (typeof setting == "function") settings[s] = await setting(args, opts);
    }
}

async function batchProcessFiles(items, processFn, batchSize = 5) {
    const chunks = chunkArray(items, batchSize);
    let results = [];
    for (const chunk of chunks) {
        const chunkResults = await Promise.all(chunk.map(processFn));
        results = results.concat(chunkResults);
    }
    return results;
}

async function validateArg(argValue, argData, args, {
    fieldMode = false,
    keywordMode = false,
    keywordStorage = {},
    keywordOpts = {}
} = {}) {
    if (typeof argValue == "function") argValue = argValue(args, keywordOpts);

    let newValue = argValue;

    let settings = argData.settings ? { ...argData.settings } : {};

    if (args) await parseFunctionSettings(settings, args, keywordOpts);

    if (argData.settings?.allowNull && (argValue === null || argValue === "")) return null;

    if (keywordMode && !argData.raw && typeof newValue == "string") {
        const { parseKeywords } = require("./keywords");
        newValue = await parseKeywords(newValue, { args, keywordStorage });
    }

    switch (argData.type) {
        case "boolean": return parseBoolean(newValue, settings);
        case "string": return parseString(newValue, settings);
        case "integer": return parseNumber(newValue, { ...settings, round: true });
        case "number": return parseNumber(newValue, settings);
        case "pixels": return parsePixels(newValue, settings);
        case "timestamp": return parseTimestamp(newValue, settings);
        case "color": return parseColor(newValue, settings);
        case "font": return parseFont(newValue, fieldMode);

        case "path": {
            newValue = newValue.replace(/([/\\]$)|(^file:\/\/)/, "") || settings.dft;
            const filePath = newValue.split(/[\\/]/g).slice(0, -1).join("/") || ".";
            if (filePath == "." && newValue != ".") newValue = `./${newValue}`;
            newValue = path.normalize(newValue);
            if (!fs.existsSync(newValue) && !fs.existsSync(filePath))
                throw `Path does not exist: ${newValue}`;
            return newValue;
        }

        case "file": {
            if (typeof newValue == "string") newValue = newValue.trim().split(/[;\n]/g);
            if (newValue.length <= 1) newValue = newValue[0];

            if (Array.isArray(newValue)) {
                newValue = await batchProcessFiles(
                    newValue.map(arg => arg.replace(/([/\\]$)|(^file:\/\/)/, "")),
                    arg => validateFile(arg, settings).then(val => fieldMode ? val?.path : val)
                );
            } else {
                newValue = await validateFile(newValue.replace(/([/\\]$)|(^file:\/\/)/, ""), settings);
                if (fieldMode) newValue = newValue.path;
            }
            return newValue;
        }

        case "multi-file": {
            if (typeof newValue == "string") newValue = newValue.trim().split(/[;\n]/g);

            if (settings.min && settings.min > newValue.length)
                throw `At least ${settings.min} files are required.`;

            newValue = await batchProcessFiles(
                newValue.map(arg => arg.replace(/([/\\]$)|(^file:\/\/)/, "")),
                arg => validateFile(arg, settings).then(val => fieldMode ? val?.path : val)
            );
            return newValue;
        }

        case "object":
        case "arguments": {
            if (typeof newValue == "string") newValue = JSON.parse(newValue);
            return newValue;
        }

        default: throw `Unknown argument type: ${argData.type}`;
    }
}

async function getDefaultArgs(command, args, { keywordMode = false }) {
    let err;
    let defaultArgs = {};

    async function getArg(argData, argName) {
        if (argData.settings?.dft !== undefined) {
            const argValue = await validateArg(argData.settings.dft, argData, args, { keywordMode });
            if (argValue !== undefined) defaultArgs[argName] = argValue;
        }
    }

    if (command.args) for (let argName in command.args) {
        await getArg(command.args[argName], argName).catch((e) => err = e);
        if (err) throw err;
    }

    if (command.globalArgs) for (let argName of command.globalArgs) {
        await getArg(app.globalArgs[argName], argName).catch((e) => err = e);
        if (err) throw err;
    }

    return defaultArgs;
}

async function addDefaultArgs(cmdArgs, command, args, {
    fieldMode = false,
    keywordMode = false,
    skipRequired = false,
    modifiedArgs,
} = {}) {
    let err;

    async function addArg(argData, argName) {
        if (!skipRequired && argData.required && cmdArgs[argName] == undefined)
            throw `${translate("errorMessages.requiredArgument")}: ${argName} (${argData.name})`;

        if (
            argData.settings?.dft !== undefined &&
            (
                cmdArgs[argName] == undefined ||
                typeof cmdArgs[argName] == "function" ||
                (modifiedArgs && !modifiedArgs.includes(argName))
            )
        ) {
            const argValue = await validateArg(argData.settings.dft, argData, args, { fieldMode, keywordMode });
            if (argValue !== undefined) cmdArgs[argName] = argValue;
        }
    }

    if (command.args) for (let argName in command.args) {
        await addArg(command.args[argName], argName).catch((e) => err = e);
        if (err) throw err;
    }

    if (command.globalArgs) for (let argName of command.globalArgs) {
        await addArg(app.globalArgs[argName], argName).catch((e) => err = e);
        if (err) throw err;
    }

    return cmdArgs;
}

async function parseCmdArgs(command, argsRaw) {
    const args = {};
    const argIndexes = [];
    const keywordStorage = {};

    for (let i = 0; i < argsRaw.length; i++) {
        let match = argsRaw[i].match(/^--?([a-zA-Z0-9_]+)$/);
        if (!match) continue;

        let argName = match[1];
        argName = findCmdArg(command, argName, args);
        if (!argName) continue;

        const argData = command.args?.[argName] || app.globalArgs[argName];
        if (!argData) continue;

        try {
            const argValue = await validateArg(argsRaw[i + 1], argData, args, {
                keywordMode: true,
                keywordStorage
            });

            if (argValue !== undefined) {
                args[argName] = argValue;
                argIndexes.push(i);
            }
        } catch (err) {
            console.error(`${translate("errorMessages.invalidArgument")}: ${argName}\n${err}`);
        }
    }

    await addDefaultArgs(args, command, args, { keywordMode: true });
    return [args, argIndexes];
}

function findCmdArg(command, argName, args) {
    const commandArgs = Object.entries(command.args || {});
    const globalArgs = Object.entries(app.globalArgs);

    const argFinder = ([arg, data]) => (
        arg.toLowerCase() === argName.toLowerCase()
        || data.alias && (
            Array.isArray(data.alias)
                ? data.alias.find(a => a.toLowerCase() === argName.toLowerCase())
                : data.alias.toLowerCase() === argName.toLowerCase()
        )
    ) && !args[arg];

    const findCommandArg = commandArgs.find(argFinder);

    const findGlobalArg = command.globalArgs.find(
        (name) => globalArgs.find(argFinder)?.[0] == name
    );

    return findCommandArg?.[0] || findGlobalArg?.[0];
}

module.exports = {
    getArgOption,
    parseBoolean,
    parseNumber,
    parseString,
    parsePixels,
    parseTimestamp,
    validateArg,
    getDefaultArgs,
    addDefaultArgs,
    parseCmdArgs
};