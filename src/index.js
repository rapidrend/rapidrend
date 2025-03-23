const path = require("path");

global.appPath = path.normalize(path.join(__dirname, ".."));
if (process.cwd() != appPath) process.chdir(appPath);

const App = require("#main");

async function main() {
    const app = global.app = new App();

    if (process.argv.length > 2) {
        const CLIApp = require("./cliApp");
        const cliApp = new CLIApp(app);

        const args = process.argv;
        process.argv.splice(0, 2);

        await cliApp.init(args).catch((err) => console.log(err));

        process.exit(0);
    } else {
        const GUIApp = require("./guiApp");
        const guiApp = new GUIApp(app);

        process.title = "RapidRend";
        guiApp.init();
    }
}

main();