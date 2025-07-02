const Message = require("#classes/Message");

const { translate } = require("#functions/translate");
const { writeAllConfigs } = require("#functions/filesystem");
const { getLocalCommands } = require("#functions/commands");

module.exports = {
    name: translate("commands.localcommand.name"),
    description: translate("commands.localcommand.description"),
    category: translate("categories.local"),
    args: require("#args/commands/local/localcommand"),
    forLocalCommand: true,

    async execute(args) {
        const { name, description, args: commandArgs, phrase } = args;
        const commandKey = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

        if (!commandKey)
            throw new Error("Invalid command name. Use alphanumeric characters, hyphens, or underscores only.");

        if (!phrase || typeof phrase !== "string")
            throw new Error("Phrase is required and must be a string.");

        appConfigs.settings.localCommands[commandKey] = {
            name,
            description,
            args: commandArgs,
            phrase
        };

        getLocalCommands();
        writeAllConfigs();

        return new Message(
            "success",
            translate("popupDisplay.status.success.localCommandTitle"),
            translate("popupDisplay.status.success.localCommandDesc", name)
        );
    }
};
