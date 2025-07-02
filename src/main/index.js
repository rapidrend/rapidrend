const path = require("path");
const envPaths = require("env-paths");
const fs = require("fs-extra");

const { tmpdir } = require("os");
const nodeCleanup = require("node-cleanup");

const EventEmitter = require("events");

const { loadTranslations } = require("#functions/translate");
const { cleanTmpDirs, loadConfig, writeAllConfigs, loadAllConfigs } = require("#functions/filesystem");
const { monitorCommandTasks, killAllProcesses } = require("#functions/monitoring");

const getGlobalArgs = require("#utils/globalArgs");

class App {
    constructor() {
        this.initVars();
        this.initApp();
    }

    initVars() {
        const paths = envPaths("rapidrend", { suffix: "" });

        this.pkg = fs.readJSONSync("package.json");
        this.vars = {
            cli: false,
            folders: {
                temp: path.join(tmpdir(), "rapidrend"),
                settings: paths.config,
                cache: paths.cache
            }
        };

        this.listeners = {};
        this.emitters = {
            commandTask: new EventEmitter(),
            tempFolder: new EventEmitter(),
            childProcess: new EventEmitter(),
            infoPost: new EventEmitter()
        };
        this.counters = {
            commandTasks: 0
        };

        this.commandTasks = {};
        this.tempFolders = [];
        this.childProcesses = {};
        this.infoPost = [];
    }

    initApp() {
        const { vars: { folders }, childProcesses } = this;
        
        require("#utils/prototypeFunctions");

        this.configs = loadAllConfigs(folders);
        loadTranslations(this.configs.settings.language);

        this.commands = require("#commands");
        this.special = require("#special");
        this.globalArgs = getGlobalArgs();

        monitorCommandTasks(this);
        cleanTmpDirs(folders.temp);
        writeAllConfigs(folders, this.configs);

        nodeCleanup(() => this.stopApp(childProcesses, folders, this.configs));
    }

    stopApp(childProcesses, folders, configs) {
        childProcesses = childProcesses ?? this.childProcesses;
        folders = folders ?? this.vars.folders;
        configs = configs ?? this.configs;

        //if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
        killAllProcesses(childProcesses, folders, configs);
        cleanTmpDirs(folders.temp, true);
    }
}

module.exports = App;
