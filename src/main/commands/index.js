let commandGroups = {
    animation: require("./animation"),
    duration: require("./duration"),
    resizing: require("./resizing"),
    overlaying: require("./overlaying"),
    color: require("./color")
};

let commands = {};

for (let category in commandGroups) {
    let commandGroup = commandGroups[category];
    for (let command in commandGroup) {
        commands[command] = commandGroup[command];
    }
}

module.exports = {
    groups: commandGroups,
    all: commands
};