const fs = require("fs-extra");
const path = require("path");

class FileEmbed {
    constructor(tempPath) {
        if (!fs.existsSync(tempPath)) throw `Failed to process file: ${tempPath}`;

        this.isTempDir = tempPath.startsWith(app.vars.folders.temp);

        this.tempPath = tempPath;
        this.currentPath = tempPath;
    }

    move(newPath) {
        newPath = path.resolve(newPath);

        try {
            fs.copyFileSync(this.currentPath, newPath, fs.constants.COPYFILE_FICLONE);
            if (this.currentPath == this.tempPath && this.isTempDir) this.remove();
        } catch {}

        this.currentPath = newPath;
    }

    remove() {
        if (!this.tempPath || !this.isTempDir) return;

        const pathData = path.parse(this.tempPath);
        try { fs.rmSync(pathData.dir, { recursive: true, force: true }); } catch {}

        this.emitRemoveEvent();
        delete this.tempPath;
    }

    emitRemoveEvent() {
        const tempFolder = app.tempFolders.find(tmp => this.tempPath.includes(tmp));
        if (tempFolder) app.emitters.tempFolder.emit("delete", tempFolder);
    }
};

module.exports = FileEmbed;