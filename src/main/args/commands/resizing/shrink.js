const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.shrink.args.input.name"),
        desc: translate("commands.shrink.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    multiplier: {
        alias: "m",
        name: translate("commands.shrink.args.multiplier.name"),
        desc: translate("commands.shrink.args.multiplier.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 2,
            min: 1
        },
        gui: {
            group: "scale",
            order: 0
        }
    },
    direction: {
        alias: "d",
        name: translate("commands.shrink.args.direction.name"),
        desc: translate("commands.shrink.args.direction.desc"),
        type: "string",
        required: false,
        settings: {
            allowed: {
                both: translate("argValues.direction.both"),
                horizontal: translate("argValues.direction.horizontal"),
                vertical: translate("argValues.direction.vertical")
            },
            dft: "both"
        },
        gui: {
            group: "scale",
            order: 1
        }
    },
    scaleAlgorithm: {
        alias: "s",
        name: translate("commands.shrink.args.scaleAlgorithm.name"),
        desc: translate("commands.shrink.args.scaleAlgorithm.desc"),
        type: "string",
        required: false,
        settings: {
            allowed: {
                fast_bilinear: translate("argValues.scaleAlgorithm.fast_bilinear"),
                bilinear: translate("argValues.scaleAlgorithm.bilinear"),
                bicubic: translate("argValues.scaleAlgorithm.bicubic"),
                experimental: translate("argValues.scaleAlgorithm.experimental"),
                neighbor: translate("argValues.scaleAlgorithm.neighbor"),
                area: translate("argValues.scaleAlgorithm.area"),
                bicublin: translate("argValues.scaleAlgorithm.bicublin"),
                gauss: translate("argValues.scaleAlgorithm.gauss"),
                sinc: translate("argValues.scaleAlgorithm.sinc"),
                lanczos: translate("argValues.scaleAlgorithm.lanczos"),
                spline: translate("argValues.scaleAlgorithm.spline"),
                print_info: translate("argValues.scaleAlgorithm.print_info"),
                accurate_rnd: translate("argValues.scaleAlgorithm.accurate_rnd"),
                full_chroma_int: translate("argValues.scaleAlgorithm.full_chroma_int"),
                full_chroma_inp: translate("argValues.scaleAlgorithm.full_chroma_inp"),
                bitexact: translate("argValues.scaleAlgorithm.bitexact")
            },
            dft: "bicubic"
        },
        gui: {
            more: true,
            group: "scaleAlgorithm",
            order: 0
        }
    }
};