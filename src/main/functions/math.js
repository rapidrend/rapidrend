function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min, max) {
    if (min == undefined && max == undefined) return Math.random();
    if (max == undefined) {
        max = min;
        min = 1;
    }

    return Math.floor(Math.random() * (max + 1 - min)) + min;
}

function roundTo(n, r) {
    return Math.round(n / r) * r;
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, "");

    if (hex.length === 3) hex = hex.split("").map(char => char + char).join("");

    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return [r, g, b];
}

function rgbToHex({ r, g, b }) {
    const clamp = (val) => Math.max(0, Math.min(255, val));

    const toHex = (val) => clamp(val).toString(16).padStart(2, '0');

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToNumber({ r, g, b }) {
    const a = 0xff;
    return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

function divisionString(div) {
    const divMatch = typeof div == "string" && div.match(/^([0-9]+)\/([0-9]+)$/);
    if (divMatch) div = Number(divMatch[1]) / Number(divMatch[2]);
    return Number(div);
}

function shuffle(array) {
    let currentIndex = array.length;
    let randomIndex;

    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array
}

function similarity(s1, s2) {
    function editDistance(s1, s2) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();

        const costs = new Array();
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i == 0)
                    costs[j] = j;
                else {
                    if (j > 0) {
                        const newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1))
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0)
                costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }

    const longerLength = longer.length;
    if (longerLength == 0) return 1.0;
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

module.exports = {
    randomChoice,
    randomNumber,
    roundTo,
    hexToRgb,
    rgbToHex,
    rgbToNumber,
    divisionString,
    shuffle,
    similarity
};