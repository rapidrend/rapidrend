module.exports = {
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms ?? 0)),
    
    regexClean: (str) => str.replace(/[\\^$.|?*+()[{]/g, (match) => `\\${match}`),
    
    escapeHTML: (value) => value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/"/g, "&apos;"),

    unescapeHTML: (value) => value
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#[0-9]+;/g, (match) => {
            return String.fromCharCode(match.substring(2, match.length - 1))
        }),
    
    equalValues(arr, val) {
        var count = 0
        arr.forEach(v => v == val && count++)
        return count
    },

    roundTo: (n, r) => Math.round(n / r) * r,

    generateId(existing, length = 10) {
        var charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_"
        var id = ""
    
        for (var i = 0; i < length; i++) {
            id += charset[Math.floor(Math.random() * charset.length)]
        }
    
        if (existing && existing.includes(id)) return functions.generateId(existing, length)
    
        return id
    },

    tryJSONparse(obj) {
        try {
            return JSON.parse(obj)
        } catch (_) {
            return null
        }
    },

    infoPost(message) {
        const app = global.app;

        console.log(message);

        for (const m of message.split("\n")) {
            if (!m.trim()) continue;
            app.infoPost.push(m);
            app.infoPostEmitter.emit("event", m);
        }
    },

    findCommand(name) {
        const app = global.app;
        const commands = app.commands;

        return commands.all[name.toLowerCase()];
    }
};