class FileInfo {
    constructor(info) {
        for (const [key, val] of Object.entries(info)) {
            this[key] = val;
        }
    }
};

module.exports = FileInfo;