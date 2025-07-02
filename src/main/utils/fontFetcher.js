const { execPromise } = require("#functions/media");

let fontsData, gatherFonts;

const styleValues = {
    style: {
        Normal: 0,
        Italic: 1 << 0,
        Oblique: 1 << 1
    },
    weight: {
        Thin: 1 << 2,
        ExtraLight: 1 << 4,
        Light: 1 << 6,
        Normal: 1 << 9,
        Medium: 1 << 11,
        DemiBold: 1 << 13,
        Bold: 1 << 15,
        ExtraBold: 1 << 17,
        Black: 1 << 19
    },
    stretch: {
        UltraCondensed: 1 << 3,
        ExtraCondensed: 1 << 5,
        Condensed: 1 << 7,
        SemiCondensed: 1 << 8,
        Normal: 1 << 10,
        SemiExpanded: 1 << 12,
        Expanded: 1 << 14,
        ExtraExpanded: 1 << 16,
        UltraExpanded: 1 << 18
    }
};

const weightValues = {
    100: "Thin",
    200: "ExtraLight",
    300: "Light",
    400: "Normal",
    500: "Medium",
    600: "DemiBold",
    700: "Bold",
    800: "ExtraBold",
    900: "Black"
};

function calculateStyleOrder(style) {
    let styleOrder = 0;

    styleOrder += styleValues.stretch[style.stretch];
    styleOrder += styleValues.weight[weightValues[style.weight]];
    styleOrder += styleValues.style[style.style];

    return styleOrder;
}

async function getFonts() {
    if (fontsData) return fontsData;

    let blocks = "";

    gatherFonts = gatherFonts ?? execPromise(`magick -list font`, {
        stdout: (buffer) => blocks += buffer.toString()
    });

    await gatherFonts;

    blocks = blocks
        .split("\n")
        .filter(line => !line.trim().startsWith("Path:"))
        .join("\n")
        .trim()
        .split(/(?=Font: )/g);

    const currentFonts = {};

    for (const block of blocks) {
        const lines = block.trim().split("\n").map(line => line.trim());
        const name = lines[0].split(": ")[1];
        const details = Object.fromEntries(lines.slice(1).map(line => line.split(/: (.+)/)));
        const family = details.family;

        if (!currentFonts[family]) {
            currentFonts[family] = [];
        }

        currentFonts[family].push({
            name,
            style: details.style,
            stretch: details.stretch,
            weight: parseInt(details.weight),
            glyphs: details.glyphs
        });
    }

    for (const family of Object.values(currentFonts)) {
        family.sort((a, b) => calculateStyleOrder(a) - calculateStyleOrder(b))
    }

    fontsData = currentFonts;

    return fontsData;
}

module.exports = getFonts;