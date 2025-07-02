const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.scale.args.input.name"),
        desc: translate("commands.scale.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    width: {
        alias: "w",
        name: translate("commands.scale.args.width.name"),
        desc: translate("commands.scale.args.width.desc"),
        type: "pixels",
        required: true,
        settings: {
            dft: (args) => args.input?.width,
            min: 1,
            base: (args) => args.input?.width,
            round: true
        },
        gui: {
            group: "dimensions",
            order: 0
        }
    },
    height: {
        alias: "h",
        name: translate("commands.scale.args.height.name"),
        desc: translate("commands.scale.args.height.desc"),
        type: "pixels",
        required: true,
        settings: {
            dft: (args) => args.input?.height,
            min: 1,
            base: (args) => args.input?.height,
            round: true
        },
        gui: {
            group: "dimensions",
            order: 1
        }
    },
    mode: {
        alias: "m",
        name: translate("commands.scale.args.mode.name"),
        desc: translate("commands.scale.args.mode.desc"),
        type: "string",
        required: false,
        settings: {
            allowed: {
                scale: translate("argValues.scaleMode.scale"),
                area: translate("argValues.scaleMode.area"),
                zoom: translate("argValues.scaleMode.zoom")
            },
            dft: "scale"
        },
        gui: {
            group: "mode",
            order: 0
        }
    },
    keepAspectRatio: {
        alias: "a",
        name: translate("commands.scale.args.keepAspectRatio.name"),
        desc: translate("commands.scale.args.keepAspectRatio.desc"),
        type: "string",
        required: false,
        settings: {
            allowed: {
                no: translate("argValues.keepAspectRatio.no"),
                increase: translate("argValues.keepAspectRatio.increase"),
                decrease: translate("argValues.keepAspectRatio.decrease")
            },
            dft: "no"
        },
        gui: {
            group: "mode",
            order: 1
        }
    },
    originY: {
        name: translate("commands.scale.args.originY.name"),
        desc: translate("commands.scale.args.originY.desc"),
        type: "string",
        required: false,
        settings: {
            allowed: {
                top: translate("argValues.originY.top"),
                middle: translate("argValues.originY.middle"),
                bottom: translate("argValues.originY.bottom")
            },
            dft: "middle"
        },
        gui: {
            group: "origin",
            order: 0
        }
    },
    originX: {
        name: translate("commands.scale.args.originX.name"),
        desc: translate("commands.scale.args.originX.desc"),
        type: "string",
        required: false,
        settings: {
            allowed: {
                left: translate("argValues.originX.left"),
                center: translate("argValues.originX.center"),
                right: translate("argValues.originX.right")
            },
            dft: "center"
        },
        gui: {
            group: "origin",
            order: 1
        }
    },
    scaleAlgorithm: {
        alias: "s",
        name: translate("commands.scale.args.scaleAlgorithm.name"),
        desc: translate("commands.scale.args.scaleAlgorithm.desc"),
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