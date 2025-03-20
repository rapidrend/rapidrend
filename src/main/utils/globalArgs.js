const { translate } = require("#functions/translate");

module.exports = {
    encodingPreset: {
        name: translate("globalArgs.encodingPreset.name"),
        desc: translate("globalArgs.encodingPreset.desc"),
        type: "string",
        required: false,

        settings: {
            dft: "veryfast",

            allowed: [
                "ultrafast",
                "superfast",
                "veryfast",
                "faster",
                "fast",
                "medium",
                "slow",
                "slower",
                "veryslow"
            ]
        }
    },
};