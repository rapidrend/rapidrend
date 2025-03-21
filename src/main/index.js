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

        cleanTmpDirs(this.config.tempFolder);
    }
}

module.exports = App;