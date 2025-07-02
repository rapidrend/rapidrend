const { translate } = require("#functions/translate");

module.exports = {
    base: {
        alias: "i",
        name: translate("commands.blend.args.base.name"),
        desc: translate("commands.blend.args.base.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    blend: {
        alias: "i",
        name: translate("commands.blend.args.blend.name"),
        desc: translate("commands.blend.args.blend.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    mode: {
        name: translate("commands.blend.args.mode.name"),
        desc: translate("commands.blend.args.mode.desc"),
        type: "string",
        required: false,
        settings: {
            allowed: {
                addition: translate("argValues.blendMode.addition"),
                and: translate("argValues.blendMode.and"),
                average: translate("argValues.blendMode.average"),
                burn: translate("argValues.blendMode.burn"),
                bleach: translate("argValues.blendMode.bleach"),
                darken: translate("argValues.blendMode.darken"),
                difference: translate("argValues.blendMode.difference"),
                divide: translate("argValues.blendMode.divide"),
                dodge: translate("argValues.blendMode.dodge"),
                freeze: translate("argValues.blendMode.freeze"),
                exclusion: translate("argValues.blendMode.exclusion"),
                extremity: translate("argValues.blendMode.extremity"),
                geometric: translate("argValues.blendMode.geometric"),
                glow: translate("argValues.blendMode.glow"),
                grainExtract: translate("argValues.blendMode.grainExtract"),
                grainMerge: translate("argValues.blendMode.grainMerge"),
                hardLight: translate("argValues.blendMode.hardLight"),
                hardOverlay: translate("argValues.blendMode.hardOverlay"),
                harmonic: translate("argValues.blendMode.harmonic"),
                interpolate: translate("argValues.blendMode.interpolate"),
                hardMix: translate("argValues.blendMode.hardMix"),
                heat: translate("argValues.blendMode.heat"),
                lighten: translate("argValues.blendMode.lighten"),
                linearLight: translate("argValues.blendMode.linearLight"),
                multiply: translate("argValues.blendMode.multiply"),
                multiply128: translate("argValues.blendMode.multiply128"),
                negation: translate("argValues.blendMode.negation"),
                normal: translate("argValues.blendMode.normal"),
                or: translate("argValues.blendMode.or"),
                overlay: translate("argValues.blendMode.overlay"),
                phoenix: translate("argValues.blendMode.phoenix"),
                pinLight: translate("argValues.blendMode.pinLight"),
                reflect: translate("argValues.blendMode.reflect"),
                screen: translate("argValues.blendMode.screen"),
                stain: translate("argValues.blendMode.stain"),
                softLight: translate("argValues.blendMode.softLight"),
                softDifference: translate("argValues.blendMode.softDifference"),
                subtract: translate("argValues.blendMode.subtract"),
                vividLight: translate("argValues.blendMode.vividLight"),
                xor: translate("argValues.blendMode.xor")
            },
            dft: "addition"
        }
    }
};