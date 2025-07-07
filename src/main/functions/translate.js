const path = require("path");
const fs = require("fs-extra");

const defaultSettings = require("../configs/settings");

function loadTranslations(lang = defaultSettings.language) {
    if (!global.appTranslations) {
        global.appTranslations = {
            current: defaultSettings.language,
            data: {}
        };
    }

    try {
        const filePath = path.join(__appPath, "assets", "lang", `${lang}.json`);

        appTranslations.data = fs.readJSONSync(filePath);
        appTranslations.current = lang;
    } catch (error) {
        console.error(`Error loading ${lang} translations:`, error);
        appTranslations.data = {};
    }
}

function translate(key, ...replace) {
    const keys = key.split(".");
    let result = appTranslations.data;

    for (const k of keys) {
        result = result?.[k];
        if (result == undefined) return key;
    }

    if (typeof result == "string")
        for (const rep of replace)
            result = result.replace("%s", rep);

    return result;
}

module.exports = {
    loadTranslations,
    translate
};