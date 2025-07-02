const { translate } = require("#functions/translate");

module.exports = {
    base: {
        alias: "i",
        name: translate("commands.mask.args.base.name"),
        desc: translate("commands.mask.args.base.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    mask: {
        alias: "i",
        name: translate("commands.mask.args.mask.name"),
        desc: translate("commands.mask.args.mask.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    keep: {
        alias: "k",
        name: translate("commands.mask.args.keep.name"),
        desc: translate("commands.mask.args.keep.desc"),
        type: "boolean",
        required: false,
        settings: {
            dft: false
        }
    },
    originY: {
        alias: "oy",
        name: translate("commands.mask.args.originY.name"),
        desc: translate("commands.mask.args.originY.desc"),
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
            more: true,
            group: "origin",
            order: 0
        }
    },
    originX: {
        alias: "ox",
        name: translate("commands.mask.args.originX.name"),
        desc: translate("commands.mask.args.originX.desc"),
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
            more: true,
            group: "origin",
            order: 1
        }
    },
    x: {
        name: translate("commands.mask.args.x.name"),
        desc: translate("commands.mask.args.x.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 0,
            round: true
        },
        gui: {
            more: true,
            group: "origin",
            order: 2
        }
    },
    y: {
        name: translate("commands.mask.args.y.name"),
        desc: translate("commands.mask.args.y.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 0,
            round: true
        },
        gui: {
            more: true,
            group: "origin",
            order: 3
        }
    },
    width: {
        alias: "w",
        name: translate("commands.mask.args.width.name"),
        desc: translate("commands.mask.args.width.desc"),
        type: "pixels",
        required: false,
        settings: {
            min: 1,
            base: (args) => args.base?.width,
            round: true
        },
        gui: {
            more: true,
            group: "scale",
            order: 0
        }
    },
    height: {
        alias: "h",
        name: translate("commands.mask.args.height.name"),
        desc: translate("commands.mask.args.height.desc"),
        type: "pixels",
        required: false,
        settings: {
            min: 1,
            base: (args) => args.base?.height,
            round: true
        },
        gui: {
            more: true,
            group: "scale",
            order: 1
        }
    },
    keepAspectRatio: {
        alias: "ratio",
        name: translate("commands.mask.args.keepAspectRatio.name"),
        desc: translate("commands.mask.args.keepAspectRatio.desc"),
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
            more: true,
            group: "scale",
            order: 2
        }
    }
};