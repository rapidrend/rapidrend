module.exports = {
    async replaceAsync(str, regex, asyncCallback) {
        var promises = []
        str.replace(regex, (match, ...args) => {
            var promise = asyncCallback(match, ...args)
            promises.push(promise)
        })
        var data = await Promise.all(promises)
        return str.replace(regex, () => data.shift())
    },

    async findAsync(arr, asyncCallback) {
        var promises = arr.map(asyncCallback)
        var results = await Promise.all(promises)
        var index = results.findIndex(result => result)
        return arr[index]
    },

    async filterAsync(arr, asyncCallback) {
        var promises = arr.map(asyncCallback)
        var results = await Promise.all(promises)
        var index = results.findIndex(result => result)
        return index
    }
};