const path = require("path");

const globalArgs = require("#utils/globalArgs");

const { validateFile } = require("./media");

const functions = {
    getArgOption(args, name, {
        dft = undefined, n = 1, splice = false, join = true, func = (opt) => opt, stopMatch = []
    } = {}) {
        const optionIndex = args.indexOf(`--${name}`);
        if (optionIndex > -1) {
            let option = [];
            var spliceCount = 0
            for (var i = 1; i <= Math.min(n, args.length - optionIndex - 1); i++) {
                if (stopMatch.includes(args[optionIndex + i])) break;
                spliceCount++;
                option.push(func(args[optionIndex + i], i));
            }
            if (splice) args.splice(optionIndex, spliceCount + 1);
            if (join) option = option.join(" ");
            return n == 0 ? true : isNaN(Number(option)) ? option : Number(option);
        }
        return dft
    },

    parseNumber(val, {
        dft = undefined, min = -Infinity, max = Infinity, round = false
    } = {}) {
        if (val == undefined || val === "") val = dft ?? 0;
        if (typeof val != "number") val = Number(val);

        val = Math.clamp(val, min, max);
        if (round) val = Math.round(val);

        return isNaN(val) ? dft : val ?? dft;
    },

    parseString(val, {
        allowed = [], dft = undefined, lower = false, upper = false
    } = {}) {
        if (val == undefined || val === "") val = dft ?? "";

        const query = upper ? val.toUpperCase()
            : lower ? val.toLowerCase()
                : val;

        return allowed.length && allowed.find(q => q == query) || dft;
    },

    parsePixels(val, {
        dft = undefined, min = -Infinity, max = Infinity
    } = {}) {
        if (val == undefined) val = dft ?? 0;
        if (typeof val != "string") val = String(val);

        if (val.endsWith("%")) {
            const percentage = Number(val.slice(0, -1)) * 0.01;
            val = percentage * max;
        }

        return functions.parseNumber(val, { dft, min, max, round: true });
    },

    parseTimestamp(val, {
        dft = undefined, min = -Infinity, max = Infinity
    } = {}) {
        if (val == undefined) val = dft ?? 0;
        if (typeof val != "string") val = String(val);

        const total = 0;
        val = val.split(':').reverse();
        val.splice(3);

        for (var i = 0; i < val.length; i++) {
            val[i] = functions.parseNumber(Number(val[i]) * (Math.pow(60, i)), {
                min: 0,
                dft: 0
            });
            total += val[i];
        }

        return functions.parseNumber(total, { dft, min, max });
    },

    hasFunctionSettings(argData) {
        for (let s in argData.settings) {
            const setting = argData.settings[s];
            if (typeof setting == "function") return true;
        }

        return false;
    },

    parseFunctionSettings(settings, args) {
        for (let s in settings) {
            const setting = settings[s];
            if (typeof setting == "function") settings[s] = setting(args);
        }
    },

    async validateArg(argValue, argData, args, fieldMode) {
        if (typeof argValue == "function") argValue = argValue(args);

        let newValue = false;

        let settings = argData.settings ? { ...argData.settings } : {};

        if (args) functions.parseFunctionSettings(settings, args);

        switch (argData.type) {
            case "boolean":
                newValue = !!argValue;
                break;

            case "number":
                newValue = functions.parseNumber(argValue, settings);
                break;

            case "string":
                newValue = functions.parseString(argValue, settings);
                break;

            case "pixels":
                newValue = functions.parsePixels(argValue, settings);
                break;

            case "timestamp":
                newValue = functions.parseTimestamp(argValue, settings);
                break;

            case "path":
                newValue = argValue.replace(/([/\\]$)|(^file:\/\/)/, "") || settings.dft;
                const filePath = newValue.split(/[\\/]/g).slice(0, -1).join("/") || ".";
                if (filePath == "." && newValue != ".") newValue = `./${newValue}`;
                newValue = path.normalize(newValue);
                if (!fs.existsSync(newValue) && !fs.existsSync(filePath)) throw `Path does not exist: ${newValue}`;
                break;

            case "file":
                newValue = await validateFile(argValue.replace(/([/\\]$)|(^file:\/\/)/, ""), settings);
                if (fieldMode) newValue = newValue.path;
                break;

            default:
                throw `Unknown argument type: ${argData.type}`;
        }

        return newValue;
    },

    async getDefaultArgs(command, args) {
        let err;
        let defaultArgs = {};

        async function getArg(argData, argName) {
            if (argData.settings?.dft !== undefined) {
                const argValue = await functions.validateArg(argData.settings.dft, argData, args);
                if (argValue !== undefined && argValue !== false) defaultArgs[argName] = argValue;
            }
        }

        if (command.args) for (let argName in command.args) {
            getArg(command.args[argName], argName).catch((e) => err = e);
            if (err) throw err;
        }

        if (command.globalArgs) for (let argName of command.globalArgs) {
            getArg(globalArgs[argName], argName).catch((e) => err = e);
            if (err) throw err;
        }

        return defaultArgs;
    },

    async addDefaultArgs(cmdArgs, command, args, { fieldMode = false, modifiedArgs } = {}) {
        let err;

        async function addArg(argData, argName) {
            if (!fieldMode && argData.required && cmdArgs[argName] == undefined)
                throw `A required argument has not been specified: ${argName} (${argData.name})`;

            if (
                argData.settings?.dft !== undefined &&
                (
                    cmdArgs[argName] == undefined ||
                    typeof cmdArgs[argName] == "function" ||
                    (modifiedArgs && !modifiedArgs.includes(argName))
                )
            ) {
                const argValue = await functions.validateArg(argData.settings.dft, argData, args, fieldMode);
                if (argValue !== undefined && argValue !== false) cmdArgs[argName] = argValue;
            }
        }

        if (command.args) for (let argName in command.args) {
            addArg(command.args[argName], argName).catch((e) => err = e);
            if (err) throw err;
        }

        if (command.globalArgs) for (let argName of command.globalArgs) {
            addArg(globalArgs[argName], argName).catch((e) => err = e);
            if (err) throw err;
        }

        return cmdArgs;
    }
}

module.exports = functions;