// All emojis here are fetched from the jdecked Twemoji repo.

const axios = require("axios");

let emojiData;
let gatherEmojis;

async function getEmojis() {
    if (emojiData) return emojiData;

    gatherEmojis = gatherEmojis ??
        axios.get(`https://api.github.com/repos/jdecked/twemoji/git/trees/main?recursive=1`).catch(() => { });
    
    const emojiResponse = await gatherEmojis;
    const emojiRawData = emojiResponse.data.tree.filter(file => file.path.startsWith("assets/72x72/"));

    emojiData = emojiRawData.map(emoji => {
        const unicode = emoji.path.match(/[^/]+$/)[0].replace(".png", "");
        const emojiUrl = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/${emoji.path}`;

        return {
            url: emojiUrl,
            emoji: unicode.split("-").map(u => String.fromCodePoint(parseInt(u, 16))).join(""),
            unicode: unicode
        };
    })

    return emojiData;
}

module.exports = getEmojis;