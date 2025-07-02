const Jimp = require("jimp")
const path = require("path");
const loadBmfont = require("load-bmfont");

const typeof2 = require("@babel/runtime/helpers/typeof").default;
const { throwError, isNodePattern } = require("@jimp/utils");

const { measureText, measureTextHeight, splitGraphemes } = require("./measureText");
const getEmojis = require("./getEmojis");

const { scaledDimensions } = require("#functions/media");
const { infoPost } = require("#functions/general");

const jimpUrlCache = {};

function xOffsetBasedOnAlignment(font, line, maxWidth, alignment) {
    if (alignment === Jimp.HORIZONTAL_ALIGN_LEFT)
        return 0

    if (alignment === Jimp.HORIZONTAL_ALIGN_CENTER)
        return (maxWidth - measureText(font, line)) / 2;

    return maxWidth - measureText(font, line);
}

async function drawCharacter(image, font, x, y, char, grapheme) {
    if (char.width <= 0 || char.height <= 0) return;

    const characterPage = font.pages[char.page];
    let url;

    switch (char.id) {
        case "image": {
            url = grapheme.match(/(http|https):\/\/[^ "<>]+/)[0];
            break;
        }

        case "discord": {
            url = `https://cdn.discordapp.com/emojis/${grapheme.match(/[0-9]+/g).slice(-1)[0]}.png?size=1024`;
            break;
        }

        case "emoji": {
            url = char.url;
            break;
        }
    }

    if (url) {
        const emoji = jimpUrlCache[url] ?? await Jimp.read(url).catch(() => { });
        jimpUrlCache[url] = emoji;

        const scaledSize = scaledDimensions(emoji.bitmap, font.common.lineHeight, true);
        emoji.resize(scaledSize.width, scaledSize.height);

        image.blit(
            emoji,
            x + (font.common.lineHeight - emoji.bitmap.width) / 2 + char.xoffset,
            y + (font.common.lineHeight - emoji.bitmap.height) / 2 + char.yoffset
        );
    } else {
        if (font.config.color && !characterPage.isColored) {
            const { r, g, b } = font.config.color;
            characterPage.color([
                {
                    apply: "red",
                    params: [r - 255]
                },
                {
                    apply: "green",
                    params: [g - 255]
                },
                {
                    apply: "blue",
                    params: [b - 255]
                }
            ]);

            characterPage.isColored = true;
        }

        image.blit(
            characterPage,
            x + char.xoffset,
            y + char.yoffset,
            char.x,
            char.y,
            char.width,
            char.height
        );
    }
}

async function printText(image, font, x, y, text, defaultCharWidth) {
    const chars = splitGraphemes(text)

    for (let i = 0; i < chars.length; i++) {
        let charKey;
        const char = chars[i]
        const nextchar = chars[i + 1]

        if (char.type === "discord" || char.type === "image")
            charKey = char.type;
        else if (font.chars[char.grapheme])
            charKey = char.grapheme;
        else if (/\s/.test(char.grapheme))
            charKey = "";
        else
            charKey = "?";

        const fontChar = font.chars[charKey] || {};
        const fontKerning = font.kernings[charKey];

        await drawCharacter(image, font, x, y, fontChar || {}, char.grapheme);

        const kerning = fontKerning?.[nextchar?.grapheme] ?? 0;
        x += kerning + (fontChar.xadvance || defaultCharWidth);
    }
}

function splitLines(font, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = [];
    let longestLine = 0;

    words.forEach(function (word) {
        if (measureText(font, word) > maxWidth) {
            if (currentLine.length) {
                lines.push(currentLine);
                currentLine = [];
            }

            const graphemes = splitGraphemes(word).map(g => g.grapheme);
            let subLine = "";

            graphemes.forEach(g => {
                const trial = subLine + g;
                if (measureText(font, trial) > maxWidth) {
                    lines.push([subLine]);
                    subLine = g;
                } else {
                    subLine = trial;
                }
            });

            lines.push([subLine]);
            return;
        }

        const line = currentLine.concat([word]).join(" ");
        const length = measureText(font, line);

        if (length <= maxWidth) {
            if (length > longestLine) longestLine = length;
            currentLine.push(word);
        } else {
            lines.push(currentLine);
            currentLine = [word];
        }
    });
    if (currentLine.length) lines.push(currentLine);

    return {
        lines: lines,
        longestLine: longestLine
    };
}

function loadPages(dir, pages) {
    const newPages = pages.map((p) => Jimp.read(dir + "/" + p));
    return Promise.all(newPages);
}

function loadFont(file, config, cb) {
    config = config ?? {};

    if (typeof cb === "undefined" && typeof config == "function") {
        cb = config;
        config = {};
    }

    if (typeof file !== "string") return throwError("file must be a string", cb);

    return new Promise(function (resolve, reject) {
        cb = cb || function (err, font) {
            if (err) reject(err); else resolve(font);
        };

        loadBmfont(file, async function (err, font) {
            const chars = {};
            const kernings = {};

            if (err) return throwError(err, cb);

            for (let i = 0; i < font.chars.length; i++) {
                chars[String.fromCodePoint(font.chars[i].id)] = font.chars[i];
            }

            chars.image = {
                id: "image",
                x: 0,
                y: 0,
                width: font.common.lineHeight,
                height: font.common.lineHeight,
                xoffset: 0,
                yoffset: 0,
                xadvance: font.common.lineHeight,
                chnl: 0
            };

            chars.discord = {
                id: "discord",
                x: 0,
                y: 0,
                width: font.common.lineHeight,
                height: font.common.lineHeight,
                xoffset: 0,
                yoffset: 0,
                xadvance: font.common.lineHeight,
                chnl: 0
            };

            const emojis = await getEmojis().catch((e) => infoPost(e)) ?? [];

            for (let i = 0; i < emojis.length; i++) {
                const emoji = emojis[i]
                chars[emoji.emoji] = {
                    id: "emoji",
                    x: 0,
                    y: 0,
                    width: font.common.lineHeight,
                    height: font.common.lineHeight,
                    xoffset: 0,
                    yoffset: 0,
                    xadvance: font.common.lineHeight,
                    chnl: 0,
                    url: emoji.url
                };
            }

            for (let i = 0; i < font.kernings.length; i++) {
                const firstString = String.fromCodePoint(font.kernings[i].first);
                kernings[firstString] = kernings[firstString] || {};
                kernings[firstString][String.fromCodePoint(font.kernings[i].second)] = font.kernings[i].amount;
            }

            loadPages(path.dirname(file), font.pages).then(function (pages) {
                cb(null, {
                    chars: chars,
                    kernings: kernings,
                    pages: pages,
                    common: font.common,
                    info: font.info,
                    config
                });
            });
        });
    });
}

async function print(image, font, x, y, text, maxWidth, maxHeight, cb) {
    if (typeof maxWidth === "function" && typeof cb === "undefined") {
        cb = maxWidth;
        maxWidth = Infinity;
    }

    if (typeof maxWidth === "undefined") maxWidth = Infinity;

    if (typeof maxHeight === "function" && typeof cb === "undefined") {
        cb = maxHeight;
        maxHeight = Infinity;
    }

    if (typeof maxHeight === "undefined") maxHeight = Infinity;

    if (typeof2(font) !== "object")
        return throwError("font must be a Jimp loadFont", cb);
    if (typeof x !== "number" || typeof y !== "number" || typeof maxWidth !== "number")
        return throwError("x, y and maxWidth must be numbers", cb);
    if (typeof maxWidth !== "number")
        return throwError("maxWidth must be a number", cb);
    if (typeof maxHeight !== "number")
        return throwError("maxHeight must be a number", cb);

    let alignmentX;
    let alignmentY;

    if (typeof2(text) === "object" && text.text !== null && text.text !== undefined) {
        alignmentX = text.alignmentX || Jimp.HORIZONTAL_ALIGN_LEFT;
        alignmentY = text.alignmentY || Jimp.VERTICAL_ALIGN_TOP;
        text = text.text;
    } else {
        alignmentX = Jimp.HORIZONTAL_ALIGN_LEFT;
        alignmentY = Jimp.VERTICAL_ALIGN_TOP;
        text = text.toString();
    }

    if (maxHeight !== Infinity && alignmentY === Jimp.VERTICAL_ALIGN_BOTTOM)
        y += maxHeight - measureTextHeight(font, text, maxWidth);
    else if (maxHeight !== Infinity && alignmentY === Jimp.VERTICAL_ALIGN_MIDDLE)
        y += maxHeight / 2 - measureTextHeight(font, text, maxWidth) / 2;

    const defaultCharWidth = Object.entries(font.chars)[0][1].xadvance;
    const breaks = text.split("\n");
    let longestBreak = 0;

    for (let br of breaks) {
        const { lines, longestLine } = splitLines(font, br, maxWidth);

        if (longestLine > longestBreak) longestBreak = longestLine

        for (let [i, line] of Object.entries(lines)) {
            const lineString = line.join(" ");
            const alignmentWidth = xOffsetBasedOnAlignment(font, lineString, maxWidth, alignmentX);
            await printText(image, font, x + alignmentWidth, y, lineString, defaultCharWidth);
            y += i != lines.length - 1 ? font.common.lineHeight : 0;
        }

        y += font.common.lineHeight;
    }

    if (isNodePattern(cb)) {
        cb(null, this, {
            x: x + longestBreak,
            y: y
        });
    }
}

module.exports = {
    loadFont, print
};
