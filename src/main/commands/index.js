const { getLocalCommands } = require("#functions/commands");

const commandGroups = {
    resizing: require("./resizing"),
    duration: require("./duration"),
    captions: require("./captions"),
    effects: require("./effects"),
    color: require("./color"),
    overlaying: require("./overlaying"),
    animation: require("./animation"),
    local: getLocalCommands()
};

const commands = {};

for (let [category, commandGroup] of Object.entries(commandGroups)) {
    for (let [cmdName, command] of Object.entries(commandGroup)) {
        command.key = cmdName;
        command.keyCategory = category;
        commands[cmdName] = command;
    }
}

module.exports = {
    groups: commandGroups,
    all: commands
};