const path = require("path");
const { getArgOption, parseString } = require("#functions/arguments");

global.__appPath = path.normalize(path.join(__dirname, ".."));
if (process.cwd() != __appPath) process.chdir(__appPath);

function setFlags() {
    app.vars.verbose = getArgOption(process.argv, ["-V", "--verbose"], { splice: true, n: 0 });
    app.vars.noNewline = getArgOption(process.argv, ["--no-newline"], { splice: true, n: 0 });
    app.vars.theme = getArgOption(process.argv, ["--theme"],
        {
            dft: "system",
            splice: true,
            n: 1,
            func: (flag) => parseString(flag, {
                lower: true, allowed: ["system", "dark", "light"]
            })
        }
    );
}

async function main() {
    const binaryName = path.basename(process.argv[0]).toLowerCase();

    switch (binaryName) {
        case "rapidcli":
        case "node": {
            const CLIApp = require("./cliApp");
            const cliApp = new CLIApp();

            setFlags(cliApp);
            process.argv.splice(0, 2);

            await cliApp.init(process.argv).catch((err) => console.error(err));
            break;
        }

        default: {
            const GUIApp = require("./guiApp/App");
            const guiApp = new GUIApp();

            setFlags(guiApp);

            process.title = "RapidRend";
            await guiApp.initWindow();
            break;
        }
    }
}

main();