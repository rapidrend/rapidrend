const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.pseudocolor.args.input.name"),
        desc: translate("commands.pseudocolor.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    preset: {
        name: translate("commands.pseudocolor.args.preset.name"),
        desc: translate("commands.pseudocolor.args.preset.desc"),
        type: "string",
        required: false,
        settings: {
            allowed: {
                magma: translate("argValues.pseudocolorPreset.magma"),
                inferno: translate("argValues.pseudocolorPreset.inferno"),
                plasma: translate("argValues.pseudocolorPreset.plasma"),
                viridis: translate("argValues.pseudocolorPreset.viridis"),
                turbo: translate("argValues.pseudocolorPreset.turbo"),
                cividis: translate("argValues.pseudocolorPreset.cividis"),
                range1: translate("argValues.pseudocolorPreset.range1"),
                range2: translate("argValues.pseudocolorPreset.range2"),
                shadows: translate("argValues.pseudocolorPreset.shadows"),
                highlights: translate("argValues.pseudocolorPreset.highlights"),
                solar: translate("argValues.pseudocolorPreset.solar"),
                nominal: translate("argValues.pseudocolorPreset.nominal"),
                preferred: translate("argValues.pseudocolorPreset.preferred"),
                total: translate("argValues.pseudocolorPreset.total")
            },
            dft: "turbo"
        }
    }
};