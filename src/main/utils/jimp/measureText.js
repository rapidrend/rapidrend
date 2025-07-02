const { emojiRegex } = require("#variables");

const GraphemeSplitter = require("grapheme-splitter");

const graphemeSplitter = new GraphemeSplitter();
const graphemeMatches = {
    emoji: new RegExp(`^(${emojiRegex.source})`),
    discord: /^<a?:.+?:[0-9]+>/,
    image: /^<Img=((http|https):\/\/[^ "<>]+)>/
};

function getGraphemeMatch(str, index) {
    for (const i in graphemeMatches) {
        const match = str.slice(index).match(graphemeMatches[i]);
        if (match) {
            return {
                type: i,
                brk: index + match[0].length
            };
        }
    }

    return {
        type: "normal",
        brk: graphemeSplitter.nextBreak(str, index)
    };
}

function splitGraphemes(str) {
    const graphemes = [];
    let index = 0;
    let brk;

    while (index < str.length) {
        const matchContent = getGraphemeMatch(str, index);
        const type = matchContent.type;

        brk = matchContent.brk;

        graphemes.push({
            grapheme: str.substring(brk, index),
            type: type
        });

        index = brk;
    }

    if (index < str.length) {
        const matchContent = getGraphemeMatch(str, index);
        const type = matchContent.type;

        graphemes.push({
            grapheme: str.slice(index),
            type: type
        });
    }

    return graphemes;
}

function measureText(font, text) {
    const lines = text.split("\n");
    const widthList = [];

    for (let n = 0; n < lines.length; n++) {
        const line = lines[n]
        const chars = splitGraphemes(line)
        let x = 0;

        for (let i = 0; i < chars.length; i++) {
            const char = chars[i]
            const nextChar = chars[i + 1]

            if (char.type === "discord" || char.type === "image")
                x += font.chars[char.type].xadvance
            else {
                if (font.chars[char.grapheme]) {
                    const kerning = font.kernings[char.grapheme]?.[nextChar?.grapheme] ?? 0;
                    x += (font.chars[char.grapheme].xadvance ?? 0) + kerning;
                } else {
                    const unkKerning = font.kernings["?"]?.[nextChar?.grapheme] ?? 0;
                    x += (font.chars["?"]?.xadvance ?? 0) + unkKerning;
                }
            }
        }

        widthList.push(x);
    }

    widthList.sort((a, b) => b - a);

    return widthList[0];
}

function breakLongWord(font, word, maxWidth) {
    const chars = splitGraphemes(word).map(g => g.grapheme);
    const segments = [];
    let segment = "";

    for (const ch of chars) {
        const trial = segment + ch;
        if (measureText(font, trial) > maxWidth) {
            segments.push(segment || ch);
            segment = segment && (measureText(font, ch) > maxWidth) ? ch : ch;
        } else {
            segment = trial;
        }
    }

    if (segment) segments.push(segment);
    return segments;
}

function measureTextHeight(font, text, maxWidth = Infinity) {
    const paragraphs = text.split("\n");
    let totalHeight = 0;

    for (let pi = 0; pi < paragraphs.length; pi++) {
        totalHeight += font.common.lineHeight;

        const rawWords = paragraphs[pi].split(" ");
        const words = rawWords.flatMap(word =>
            measureText(font, word) > maxWidth
                ? breakLongWord(font, word, maxWidth)
                : [word]
        );

        let line = "";

        for (let wi = 0; wi < words.length; wi++) {
            const word = words[wi];
            const spacer = wi > 0 && line.length > 0 ? " " : "";
            const testLine = line + spacer + word;

            if (measureText(font, testLine) > maxWidth && line.length > 0) {
                totalHeight += font.common.lineHeight;
                line = word;
            } else {
                line = testLine;
            }
        }
    }

    return totalHeight;
}


module.exports = {
    getGraphemeMatch,
    splitGraphemes,
    measureText,
    measureTextHeight
}