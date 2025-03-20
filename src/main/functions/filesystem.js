const fs = require("fs-extra");
const path = require("path");

const { generateId } = require("./general");

module.exports = {
    makeOutputPath(filePath, outputPath) {
        const filePathData = path.parse(filePath);

        if (fs.existsSync(outputPath) && fs.lstatSync(outputPath).isDirectory()) {
            outputPath = path.join(outputPath, filePathData.base);
        }

        return outputPath;
    },

    makeTempPath(ext, name) {
        const app = global.app;
        const config = app.config;

        if (!fs.existsSync(config.tempFolder)) fs.mkdirSync(config.tempFolder);

        const pathId = generateId();
        const tempPath = path.join(config.tempFolder, pathId);
        if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath);

        const tempFilePath = path.join(tempPath, `${name ?? `output-${pathId}`}.${ext}`);

        return tempFilePath;
    },

    async cleanTmpDirs(tempFolder) {
        tempFolder = global.app && global.app.config ? global.app.config.tempFolder : tempFolder;

        if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);

        fs.readdirSync(tempFolder).forEach((dir) => {
            fs.rmSync(path.join(tempFolder, dir), { recursive: true });
        });
    }
};