module.exports = {
    randomChoice: (arr) => arr[Math.floor(Math.random() * arr.length)],

    randomNumber(min, max) {
        if (min == undefined && max == undefined) return Math.random()
        if (max == undefined) {
            max = min
            min = 1
        }

        return Math.floor(Math.random() * (max + 1 - min)) + min
    },

    shuffle(array) {
        var currentIndex = array.length,
            randomIndex

        while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--

            [array[currentIndex],
            array[randomIndex]] = [
                    array[randomIndex],
                    array[currentIndex]]
        }

        return array
    },

    similarity(s1, s2) {
        function editDistance(s1, s2) {
            s1 = s1.toLowerCase()
            s2 = s2.toLowerCase()

            var costs = new Array()
            for (var i = 0; i <= s1.length; i++) {
                var lastValue = i
                for (var j = 0; j <= s2.length; j++) {
                    if (i == 0)
                        costs[j] = j
                    else {
                        if (j > 0) {
                            var newValue = costs[j - 1]
                            if (s1.charAt(i - 1) != s2.charAt(j - 1))
                                newValue = Math.min(Math.min(newValue, lastValue),
                                    costs[j]) + 1
                            costs[j - 1] = lastValue
                            lastValue = newValue
                        }
                    }
                }
                if (i > 0)
                    costs[s2.length] = lastValue
            }
            return costs[s2.length]
        }

        var longer = s1
        var shorter = s2
        if (s1.length < s2.length) {
            longer = s2
            shorter = s1
        }
        var longerLength = longer.length
        if (longerLength == 0) {
            return 1.0
        }
        return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)
    }
};