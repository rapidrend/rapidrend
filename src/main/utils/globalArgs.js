const { translate } = require("#functions/translate");

function getGlobalArgs() {
    return {
        encodingPreset: {
            alias: "enc_preset",
            name: translate("globalArgs.encodingPreset.name"),
            desc: translate("globalArgs.encodingPreset.desc"),
            type: "string",
            required: false,

            settings: {
                dft: "veryfast",

                allowed: {
                    ultrafast: translate("argValues.encodingPreset.ultrafast"),
                    superfast: translate("argValues.encodingPreset.superfast"),
                    veryfast: translate("argValues.encodingPreset.veryfast"),
                    faster: translate("argValues.encodingPreset.faster"),
                    fast: translate("argValues.encodingPreset.fast"),
                    medium: translate("argValues.encodingPreset.medium"),
                    slow: translate("argValues.encodingPreset.slow"),
                    slower: translate("argValues.encodingPreset.slower"),
                    veryslow: translate("argValues.encodingPreset.veryslow")
                }
            },

            gui: {
                more: true
            }
        }
    };
}

module.exports = getGlobalArgs;