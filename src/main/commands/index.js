let commandGroups = {
    duration: require("./duration"),
    resizing: require("./resizing"),
    effects: require("./effects"),
    overlaying: require("./overlaying"),
    animation: require("./animation"),
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