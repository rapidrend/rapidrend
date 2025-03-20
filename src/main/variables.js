let variables = {};

const catbox = require("catbox.moe");
const youtube = require("@googleapis/youtube").youtube;
const emojiRegex = require("emoji-regex");

variables.emojiRegex = (emojiRegex.default ?? emojiRegex)();

variables.gifFormats = ["gif", "apng"];
variables.jimpFormats = ["png", "jpeg", "jpg", "gif", "bmp", "tiff"];

variables.validUrl = /https?:\/\/([!#$&-;=?-[\]_a-z~]|%[0-9a-fA-F]{2})+/;

variables.Catbox = new catbox.Catbox();
variables.Litterbox = new catbox.Litterbox();

if (process.env.GOOGLE_KEY) variables.youtube = youtube({
    version: "v3",
    auth: process.env.GOOGLE_KEY
});

variables.symbolreplacements = [
    {
        target: [
            "\u2018",
            "\u2019",
            "\u201b",
            "\u275b",
            "\u275c"
        ],
        replacement: "'"
    },
    {
        target: [
            "\u201c",
            "\u201d",
            "\u201f"
        ],
        replacement: '"'
    }
];

variables.punctuation = ["?", ".", "!", "..."];

variables.caseModifiers = [
    function (text) {
        return text.toUpperCase()
    },
    function (text) {
        return text.toLowerCase()
    },
    function (text) {
        return text.toUpperCase().substring(0, 1) + text.toLowerCase().substring(1)
    }
];

module.exports = variables;