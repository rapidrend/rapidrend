async function replaceAsync(str, regex, asyncCallback) {
    const promises = []
    str.replace(regex, (match, ...args) => {
        const promise = asyncCallback(match, ...args)
        promises.push(promise)
    })
    const data = await Promise.all(promises)
    return str.replace(regex, () => data.shift())
}

async function findAsync(arr, asyncCallback) {
    const promises = arr.map(asyncCallback);
    const results = await Promise.all(promises);
    const index = results.findIndex(result => result);
    return arr[index];
}

async function filterAsync(arr, asyncCallback) {
    const promises = arr.map(asyncCallback);
    const results = await Promise.all(promises);
    const index = results.findIndex(result => result);
    return index;
}

module.exports = {
    replaceAsync,
    findAsync,
    filterAsync
};