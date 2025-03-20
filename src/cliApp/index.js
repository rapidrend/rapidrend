const fs = require("fs-extra");

const globalArgs = require("#utils/globalArgs");
const { FileEmbed } = require("#modules");

const { findCommand } = require("#functions/general");
const { validateArg, addDefaultArgs, getArgOption } = require("#functions/arguments");
const { makeOutputPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

class CLIApp {
    constructor(app) {
        this.app = app;
        app.config.cli = true;
    }

    async parseArgs(command, argsRaw) {
        let args = {};
        let argIndexes = [];

        for (let i = 0; i < argsRaw.length; i++) {
            let argName = argsRaw[i].match(/^--?[a-zA-Z0-9]*$/)
            if (!argName) continue;

            argName = argName[0].replace(/--?/, "");
            argName = Object.keys(command.args)?.find(arg => arg.toLowerCase() == argName.toLowerCase())
                || command.globalArgs?.find(arg => arg.toLowerCase() == argName.toLowerCase());
            if (!argName) continue;

            const argData = command.args?.[argName] || globalArgs[argName];
            if (!argData) continue;

            const argValue = await validateArg(argsRaw[i + 1], argData, args).catch((err) => console.error(err));
            if (argValue == undefined) continue;

            args[argName] = argValue;
            argIndexes.push(i);
        }

        await addDefaultArgs(args, command, args);

        return [args, argIndexes];
    }

    async init(argsRaw) {
        const cmdName = argsRaw.splice(0, 1)[0];

        const command = findCommand(cmdName);
        if (!command) throw `${translate("errorMessages.invalidCommand")}: ${cmdName}`;

        const [args, argIndexes] = await this.parseArgs(command, argsRaw).catch((err) => console.error(err));
        if (!args) return;

        const cmdOutput = await command.execute(args).catch((err) => console.error(err));
        if (cmdOutput == undefined) return;

        if (cmdOutput instanceof FileEmbed) {
            const outputArg = getArgOption("output") || (argIndexes.find(i => i == argsRaw.length - 2) == undefined && argsRaw[argsRaw.length - 1]);
            const outputPath = makeOutputPath(cmdOutput.tempPath, outputArg || ".");

            cmdOutput.move(outputPath);
            cmdOutput.remove();
        } else console.log(cmdOutput);
    }
}

module.exports = CLIApp;