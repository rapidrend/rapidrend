const { parseKeywords } = require("./keywords");
const { translate } = require("./translate");

let localCommands = {};

async function executeLocalCommand(localCommand, args) {
    const result = localCommand.js
        ? await eval(localCommand.js)
        : await parseKeywords(localCommand.phrase, { args });

    return result;
}

function getLocalCommand(localCommandName, localCommandData) {
    const localCommand = {
        key: localCommandName,
        name: localCommandData.name ?? "",
        description: localCommandData.description ?? "",
        phrase: localCommandData.phrase ?? "",
        keyCategory: "local",
        category: translate("categories.local"),
        args: localCommandData.args ?? {},
        globalArgs: localCommandData.globalArgs ?? [],
        isLocalCommand: true,
        execute: async (...args) => await executeLocalCommand(localCommand, ...args),
        js: localCommandData.js
    }

    return localCommand;
}

function getLocalCommands() {
    Object.keys(localCommands).forEach(key => delete localCommands[key]);

    for (let [localCommandName, localCommandData] of Object.entries(appConfigs.settings.localCommands)) {
        const localCommand = getLocalCommand(localCommandName, localCommandData);
        if (!localCommand) continue;
        localCommands[localCommandName] = localCommand;
    }

    localCommands.localcommand = require("#commands/local/localcommand");
    localCommands.evalkeywords = require("#commands/local/evalkeywords");

    return localCommands;
}

module.exports = {
    getLocalCommands
};