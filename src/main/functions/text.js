module.exports = {
    toOrdinal(num) {
        num = String(num)
        var thmatch = num.match(/[^1][1-3]$|^[1-3]$/)
    
        if (thmatch) {
            num += ["st", "nd", "rd"][Number(thmatch[0][thmatch[0].length - 1]) - 1]
        } else {
            num += "th"
        }
    
        return num
    },
    
    chunkArray(myArray, chunk_size) {
        var arrayLength = myArray.length
        var tempArray = []
    
        for (var index = 0; index < arrayLength; index += chunk_size) {
            var myChunk = myArray.slice(index, index + chunk_size)
            tempArray.push(myChunk)
        }
    
        return tempArray;
    },

    chunkObject(object, chunk_size) {
        var values = Object.values(object)
        var final = []
        var counter = 0
        var portion = {}
    
        for (var key in object) {
            if (counter !== 0 && counter % chunk_size === 0) {
                final.push(portion)
                portion = {}
            }
            portion[key] = values[counter]
            counter++
        }
        final.push(portion)
    
        return final
    },
    
    escapeKeywordResult(string) {
        if (!(typeof string === "string" || string instanceof String)) return string
        return string
            .replace(/(?<!\\)\(/g, "\\\(")
            .replace(/(?<!\\)\)/g, "\\\)")
            .replace(/(?<!\\)\[/g, "\\\[")
            .replace(/(?<!\\)\]/g, "\\\]")
            .replace(/(?<!\\)\{/g, "\\\{")
            .replace(/(?<!\\)\}/g, "\\\}")
            .replace(/(?<!\\)\_/g, "\\\_")
            .replace(/(?<!\\)\"/g, "\\\"")
    }
};