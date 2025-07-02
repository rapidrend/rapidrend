const { scaledDimensions } = require("#functions/media");
const { translate } = require("#functions/translate");

const maxDurationFunc = (args) => (args.base?.shortType == "image" && args.overlay?.shortType == "image")
    ? Infinity
    : Math.max(args.base?.shortType != "image" && args.base?.duration || 0, args.overlay?.shortType != "image" && args.overlay?.duration || 0);

module.exports = {
    base: {
        alias: "i",
        name: translate("commands.overlay.args.base.name"),
        desc: translate("commands.overlay.args.base.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    overlay: {
        alias: "i",
        name: translate("commands.overlay.args.overlay.name"),
        desc: translate("commands.overlay.args.overlay.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    originY: {
        alias: "oy",
        name: translate("commands.overlay.args.originY.name"),
        desc: translate("commands.overlay.args.originY.desc"),
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
        name: translate("commands.overlay.args.originX.name"),
        desc: translate("commands.overlay.args.originX.desc"),
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
        name: translate("commands.overlay.args.x.name"),
        desc: translate("commands.overlay.args.x.desc"),
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
        name: translate("commands.overlay.args.y.name"),
        desc: translate("commands.overlay.args.y.desc"),
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
        name: translate("commands.overlay.args.width.name"),
        desc: translate("commands.overlay.args.width.desc"),
        type: "pixels",
        required: false,
        settings: {
            min: 1,
            dft: (args) => (args.base && args.overlay) ? scaledDimensions(args.overlay, {
                width: Math.round(args.base.width / 3),
                height: Math.round(args.base.height / 3)
            }).width : 100,
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
        name: translate("commands.overlay.args.height.name"),
        desc: translate("commands.overlay.args.height.desc"),
        type: "pixels",
        required: false,
        settings: {
            min: 1,
            dft: (args) => (args.base && args.overlay) ? scaledDimensions(args.overlay, {
                width: Math.round(args.base.width / 3),
                height: Math.round(args.base.height / 3)
            }).height : 100,
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
        name: translate("commands.overlay.args.keepAspectRatio.name"),
        desc: translate("commands.overlay.args.keepAspectRatio.desc"),
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
    },
    start: {
        name: translate("commands.overlay.args.start.name"),
        desc: translate("commands.overlay.args.start.desc"),
        type: "timestamp",
        required: false,
        settings: {
            dft: 0,
            min: 0,
            max: maxDurationFunc
        },
        gui: {
            group: "timestamp",
            order: 0
        }
    },
    end: {
        name: translate("commands.overlay.args.end.name"),
        desc: translate("commands.overlay.args.end.desc"),
        type: "timestamp",
        required: false,
        settings: {
            dft: maxDurationFunc,
            min: 0,
            max: maxDurationFunc
        },
        gui: {
            group: "timestamp",
            order: 1
        }
    }
};