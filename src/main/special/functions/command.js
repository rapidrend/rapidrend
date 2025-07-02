const CommandTask = require("#classes/CommandTask");
const FileEmbed = require("#classes/FileEmbed");
const Message = require("#classes/Message");

const { parseCmdArgs } = require("#functions/arguments");
const { translate } = require("#functions/translate");

const { cmdRegex } = require("#variables");

module.exports = {
    description: translate("special.functions.command.description"),
    args: require("#args/keywords/command"),
    func: async (args) => {
        const cmdName = args.name;
        const command = app.commands.all[cmdName];
        if (!command) throw translate("cli.help.commands.invalidCommand", cmdName);

        const argsRaw = args.args.match(cmdRegex).map(arg => {
            if (arg.match(/^.*"(?:[^"\\]|\\.)*".*$/)) {
                return arg.replace(/(?<!\\)"/g, "");
            } else {
                return arg;
            }
        });

        const [cmdArgs] = await parseCmdArgs(command, argsRaw);

        const commandTask = new CommandTask(command, cmdArgs);
        commandTask.start();

        await commandTask.task.catch(err => console.error(err));
        if (commandTask.output === undefined) return;

        let output = commandTask.output;
        
        if (output instanceof Message)
            output = `${output.title}\n- ${output.text}`;

        if (output instanceof FileEmbed) 
            output = output.currentPath;

        return output;
    }
};