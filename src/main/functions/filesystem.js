const fs = require("fs-extra");
const path = require("path");

const { generateID } = require("./general");
const defaultConfigs = require("../configs");

function makeOutputPath(filePath, outputPath) {
    const filePathData = path.parse(filePath);

    if (fs.existsSync(outputPath) && fs.lstatSync(outputPath).isDirectory())
        outputPath = path.join(outputPath, filePathData.base);

    return outputPath;
}

function makeTempPath(ext, name) {
    const vars = app.vars;
    const tempFolders = app.tempFolders;

    if (!fs.existsSync(vars.folders.temp)) fs.mkdirSync(vars.folders.temp, { recursive: true });

    const pathId = generateID();
    const tempPath = path.join(vars.folders.temp, pathId);
    if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath);

    tempFolders.push(tempPath);
    app.emitters.tempFolder.emit("create", tempPath);

    const tempFilePath = path.join(tempPath, `${name ?? `output`}-${pathId}.${ext}`);

    return tempFilePath;
}

function tryParseJSON(path) {
    try {
        return fs.readJSONSync(path);
    } catch {
        return {};
    }
}

async function cleanTmpDirs(tempFolder, isExit) {
    tempFolder = typeof app != "undefined" && app.vars ? app.vars.folders.temp : tempFolder;

    if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder, { recursive: true });

    let locks = [];

    const lockFile = path.join(tempFolder, '.app.lock');

    if (fs.existsSync(lockFile)) {
        locks = fs.readFileSync(lockFile)
            .toString().split("\n")
            .filter(pid => {
                pid = pid.trim();
                if (!pid) return false;
                try {
                    process.kill(Number(pid), 0);
                    return true;
                } catch {
                    return false;
                }
            });
    }

    const lockExists = locks.length > 0;

    if (isExit) {
        const lockIndex = locks.findIndex(l => l == process.pid.toString());
        if (lockIndex > - 1) locks.splice(lockIndex, 1);
    } else locks.push(process.pid.toString());

    if (locks.length > 0) {
        fs.writeFileSync(lockFile, locks.join("\n"));
        if (lockExists) return;
    } else {
        fs.rmSync(lockFile);
    }

    try {
        fs.readdirSync(tempFolder).forEach((dir) => {
            if (dir === '.app.lock') return;
            fs.rmSync(path.join(tempFolder, dir), { recursive: true });
        });
    } catch { }
}

function setConfigKeys(currentConfig, defaultConfig) {
    for (const [key, defaultValue] of Object.entries(defaultConfig)) {
        if (currentConfig[key] === undefined) {
            currentConfig[key] = defaultValue;
            continue;
        }

        if (typeof value == "object")
            currentConfig[key] = setConfigKeys(currentConfig[key], defaultValue);
    }

    for (const key of Object.keys(currentConfig))
        if (defaultConfig[key] === undefined)
            delete currentConfig[key];
}

function loadConfig(configFolder, name) {
    configFolder = typeof app != "undefined" && app.vars ? app.vars.folders[name] : configFolder;

    if (!fs.existsSync(configFolder)) fs.mkdirSync(configFolder, { recursive: true });

    const configPath = path.join(configFolder, `${name}.json`);
    if (!fs.existsSync(configPath))
        fs.writeJSONSync(configPath, defaultConfigs[name], { spaces: 2 });

    const currentConfig = tryParseJSON(configPath);
    setConfigKeys(currentConfig, defaultConfigs[name]);

    return currentConfig;
}

function loadAllConfigs(folders) {
    const hasApp = typeof app != "undefined";
    folders = hasApp && app.vars ? app.vars.folders : folders;

    if (!global.appConfigs) global.appConfigs = {};

    appConfigs.settings = loadConfig(folders.settings, "settings");
    appConfigs.cache = loadConfig(folders.cache, "cache");

    return global.appConfigs;
}

function writeConfig(configFolder, name, currentConfig) {
    if (!currentConfig) return;

    configFolder = typeof app != "undefined" && app.vars ? app.vars.folders[name] : configFolder;

    if (!fs.existsSync(configFolder)) fs.mkdirSync(configFolder, { recursive: true });

    const configPath = path.join(configFolder, `${name}.json`);
    fs.writeJSONSync(configPath, currentConfig, { spaces: 2 });
}

function writeAllConfigs(folders, configs) {
    const hasApp = typeof app != "undefined";
    folders = hasApp && app.vars ? app.vars.folders : folders;

    writeConfig(folders.settings, "settings", hasApp ? appConfigs.settings : configs.settings);
    writeConfig(folders.cache, "cache", hasApp ? appConfigs.cache : configs.cache);
}

function getAsset(type, name) {
    const assetPath = path.join(__appPath, "assets");

    switch (type) {
        case "font": {
            const fontsPath = path.join(assetPath, type);
            return path.join(assetPath, type, fs.readdirSync(fontsPath).find(font => font.includes(name)));
        }

        case "image": return path.join(assetPath, type, `${name}.png`);
        default: return path.join(assetPath, type, name)
    }
}

module.exports = {
    makeOutputPath,
    makeTempPath,
    cleanTmpDirs,
    setConfigKeys,
    loadConfig,
    loadAllConfigs,
    writeConfig,
    writeAllConfigs,
    getAsset
};