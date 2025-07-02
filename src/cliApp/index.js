const App = require("#main");

const FileEmbed = require("#classes/FileEmbed");
const CommandTask = require("#classes/CommandTask");
const Message = require("#classes/Message");

const chalk = require("chalk");

const { parseCmdArgs, getArgOption } = require("#functions/arguments");
const { makeOutputPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

class CLIApp extends App {
    constructor() {
        super();
        global.app = this;
        this.vars.cli = true;
    }

    showHelp() {
        console.log(chalk`\n{magenta.bold ${this.pkg.name}} v${this.pkg.version}`);
        console.log("====================================\n");

        console.log(chalk.bold(translate("cli.help.execute") + "\n"));

        console.log(chalk.bold(translate("cli.help.commandsListHeader")));
        Object.keys(this.commands.groups).forEach(cat => {
            console.log(chalk`  - {bold ${cat}} (${translate(`categories.${cat}`)})`);
        });

        console.log(chalk.bold`\n${translate("cli.help.usage")}`);
        console.log(`  commands               ${translate("cli.help.commands.usage")}`);
        console.log(`  commands <category>    ${translate("cli.help.commands.categoryUsage")}`);
        console.log(`  command <name>         ${translate("cli.help.commands.commandUsage")}`);

        console.log(chalk.bold`\n${translate("cli.help.keywordUsage")}`);
        console.log(`  keywords               ${translate("cli.help.keywords.usage")}`);
        console.log(`  keyword <name>         ${translate("cli.help.keywords.keywordUsage")}`);
        console.log(`  functions              ${translate("cli.help.functions.usage")}`);
        console.log(`  function <name>        ${translate("cli.help.functions.functionUsage")}`);

        console.log(chalk.bold`\n${translate("cli.help.flags")}`);
        console.log(`  -h, --help             ${translate("cli.help.info")}`);
        console.log(`  -v, --version          ${translate("cli.help.version")}`);
        console.log(`  -V, --verbose          ${translate("cli.help.verbose")}`);
        console.log(`  --no-newline           ${translate("cli.help.noNewline")}`);

        console.log(chalk.bold`\n${translate("cli.help.guiFlags")}`);
        console.log(`  --theme <color>        ${translate("cli.help.theme")}\n`);
    }

    showCommands() {
        console.log(chalk.bold(translate("cli.help.commands.overview")));
        Object.entries(this.commands.groups).forEach(([cat, cmds]) => {
            console.log(chalk`\n{bold ${cat}} (${translate(`categories.${cat}`)}):`);
            Object.entries(cmds)
                .forEach(
                    ([name, cmd]) => console.log(chalk`  - {bold ${name}} (${cmd.name}) - ${cmd.description}`)
                );
        });
    }

    showCategoryCommands(category) {
        const cmds = this.commands.groups[category];
        if (!cmds) {
            console.error(translate("cli.help.commands.invalidCategory", category));
            return;
        }
        console.log(`${translate("cli.help.commands.forCategory", category)}`);
        Object.entries(cmds)
            .forEach(([name, cmd]) => console.log(`  - ${name} (${cmd.name}) - ${cmd.description}`));
    }

    showCommandHelp(name) {
        const cmd = this.commands.all[name];
        if (!cmd) {
            console.error(translate("cli.help.commands.invalidCommand", name));
            return;
        }
        console.log(`${name} (${cmd.name}) - ${cmd.description}`);
        console.log(translate("cli.help.commands.argsHeader"));
        Object.entries(cmd.args || {}).forEach(([arg, data]) => {
            let alias = data.alias;
            if (alias && !Array.isArray(alias)) alias = [alias];
            console.log(`  ${alias ? `${alias.map(a => `-${a}`).join(", ")}, ` : ""}--${arg}: ${data.desc}`);
        });
    }

    showKeywords() {
        console.log(translate("cli.help.keywords.overview"));
        Object.entries(this.special.keywords)
            .filter(([_, key]) => !key.isAlias)
            .forEach(([name, key]) => console.log(`  - ${name} - ${key.description}`));
    }

    showKeywordHelp(name) {
        const key = this.special.keywords[name];
        if (!key) {
            console.error(translate("cli.help.keywords.invalidKeyword", name));
            return;
        }

        let alias = key.alias;
        if (alias && !Array.isArray(alias)) alias = [alias];

        console.log(chalk.bold(`${key.key}${alias ? `, ${alias.join(", ")}` : ""}`));
        console.log(`- ${key.description}\n`);
        if (key.values) {
            console.log(translate("cli.help.keywords.valuesHeader"));
            console.log(key.values);
        }
    }

    showFunctions() {
        console.log(translate("cli.help.functions.overview"));
        Object.entries(this.special.functions)
            .filter(([_, func]) => !func.isAlias)
            .forEach(([name, func]) => console.log(`  - ${name} - ${func.description}`));
    }

    showFunctionHelp(name) {
        const func = this.special.functions[name];
        if (!func) {
            console.error(translate("cli.help.functions.invalidFunction", name));
            return;
        }

        let alias = func.alias;
        if (alias && !Array.isArray(alias)) alias = [alias];

        console.log(chalk.bold(`${func.key}${alias ? `, ${alias.join(", ")}` : ""}`));
        console.log(`- ${func.description}\n`);
        console.log(translate("cli.help.functions.argsHeader"));
        if (func.args) {
            Object.entries(func.args).forEach(([arg, data]) => {
                console.log(chalk`  {bold ${arg}}: ${data.desc}`);
            });
        } else
            console.log(chalk`  {bold value1|value2|value3...}: ${translate("special.functions.noArgs")}`);
    }

    showOutput(output, argsRaw, argIndexes) {
        if (output instanceof Message)
            output = `${output.title}\n- ${output.text}`;

        if (output instanceof FileEmbed) {
            const outputArg = getArgOption(argsRaw, ["-output", "--output"]) || (
                argIndexes.find(i => i === argsRaw.length - 2) === undefined && argsRaw[argsRaw.length - 1]
            );
            const outputPath = makeOutputPath(output.tempPath, outputArg || ".");

            output.move(outputPath);
            output.remove();

            output = output.currentPath;
        }

        if (this.vars.noNewline) process.stdout.write(output);
        else console.log(output);
    }

    async init(argsRaw) {
        const primary = argsRaw[0]?.toLowerCase();
        const versionFlags = ["--version", "-v", "version"];
        const helpFlags = ["help", "-h", "-?", "/h", "/?", "--help", "-help"];

        if (versionFlags.includes(primary)) {
            console.log(chalk`{bold ${this.pkg.name}} v${this.pkg.version}`);
            return;
        }

        if (!primary || helpFlags.includes(primary))
            return this.showHelp();

        switch (primary) {
            case "commands":
            case "help commands": {
                argsRaw.shift();
                const category = argsRaw[0];
                return category ? this.showCategoryCommands(category) : this.showCommands();
            }

            case "command":
            case "help command":
                return this.showCommandHelp(argsRaw[1]);

            case "keywords":
            case "help keywords":
                return this.showKeywords();

            case "keyword":
            case "help keyword":
                return this.showKeywordHelp(argsRaw[1]);

            case "functions":
            case "help functions":
                return this.showFunctions();

            case "function":
            case "help function":
                return this.showFunctionHelp(argsRaw[1]);
        }

        const cmdName = argsRaw.shift();
        const command = this.commands.all[cmdName];
        if (!command) {
            console.error(`${translate("errorMessages.invalidCommand")}: ${cmdName}`);
            return;
        }

        const parsedArgs = await parseCmdArgs(command, argsRaw)
            .catch(err => console.error(err));

        if (!parsedArgs) return;

        const [args, argIndexes] = parsedArgs;

        const commandTask = new CommandTask(command, args);
        commandTask.start();

        await commandTask.task.catch(err => console.error(err));
        if (commandTask.output === undefined) return;

        const output = commandTask.output;
        if (Array.isArray(output))
            output.forEach(o => this.showOutput(o, argsRaw, argIndexes));
        else
            this.showOutput(output, argsRaw, argIndexes);
    }
}

module.exports = CLIApp;
