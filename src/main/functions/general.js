const { randomChoice } = require("./math");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms ?? 0));
}

function regexClean(str) {
    return str.replace(/[\\^$.|?*+()[{]/g, (match) => `\\${match}`);
}

function equalValues(arr, val) {
    let count = 0;
    arr.forEach(v => v == val && count++);
    return count;
}

function arrayIncludes(base, include) {
    if (!Array.isArray(base) || !Array.isArray(include)) return false;

    const includedIndexes = [];

    for (let item of include) {
        const includeIndex = base.indexOf(item);
        if (includeIndex <= -1) return false;
        includedIndexes.push(includeIndex);
    }

    return includedIndexes;
}

function chunkArray(array, chunkSize) {
    const arrayLength = array.length;
    const tempArray = [];

    for (let index = 0; index < arrayLength; index += chunkSize) {
        const myChunk = array.slice(index, index + chunkSize);
        tempArray.push(myChunk);
    }

    return tempArray;
}

function deepEqual(a, b) {
    if (a === b) return true;

    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null)
        return false;

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }

    return true;
}

function splitCamelCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function generateID(existing, length = 10) {
    const charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_"
    let id = ""

    for (let i = 0; i < length; i++) {
        id += randomChoice(charset)
    }

    if (existing && existing.includes(id)) return generateID(existing, length)

    return id
}

function infoPost(message) {
    if (app.vars.verbose) console.log(message);

    if (message instanceof Error) message = message.message;

    for (const m of message.split("\n")) {
        if (!m.trim()) continue;
        app.infoPost.push(m);
        app.emitters.infoPost.emit("event", m);
    }
}

module.exports = {
    sleep,
    regexClean,
    equalValues,
    arrayIncludes,
    chunkArray,
    deepEqual,
    splitCamelCase,
    generateID,
    infoPost
};