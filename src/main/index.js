const EventEmitter = require("node:events");

const { tmpdir } = require("os");
const path = require("path");

const { loadTranslations } = require("#functions/translate");
const { cleanTmpDirs } = require("#functions/filesystem");

class App {
    constructor(cfg = {}) {
        // setting up options
        this.config = {
            cli: false,
            tempFolder: path.join(tmpdir(), "rapidrend"),
            language: "pt-PT"
        };

        for (var i in cfg) {
            this.config[i] = cfg[i];
        }

        require("#utils/prototypeFunctions");
        loadTranslations(this.config.language);

        this.commands = require("#commands");

        this.infoPost = [];
        this.infoPostEmitter = new EventEmitter();
        this.childProcesses = {};

        cleanTmpDirs(this.config.tempFolder);

        process.on("SIGINT", () => this.killProcesses());
        process.on("SIGTERM", () => this.killProcesses());
        process.on("exit", () => this.killProcesses());
    }

    killProcesses() {
        Object.keys(this.childProcesses).forEach(pid => process.kill(pid));
        this.childProcesses = {};
        process.exit();
    }
}

module.exports = App;