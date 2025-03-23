const path = require("path");
const fs = require("fs-extra");

module.exports = {
    loadTranslations(lang = "en") {
        try {
            const filePath = path.join(appPath, "assets", "lang", `${lang}.json`);

            global.translations = fs.readJsonSync(filePath);
            global.currentLanguage = lang;
        } catch (error) {
            console.error(`Error loading ${lang} translations:`, error);
            global.translations = {};
        }
    },

    translate(key) {
        const keys = key.split('.');
        let result = global.translations;

        for (const k of keys) {
            result = result?.[k];
            if (!result) return key;
        }

        return result;
    }
};