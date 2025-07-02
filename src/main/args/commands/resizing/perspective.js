const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.perspective.args.input.name"),
        desc: translate("commands.perspective.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    stretch: {
        name: translate("commands.perspective.args.stretch.name"),
        desc: translate("commands.perspective.args.stretch.desc"),
        type: "boolean",
        required: false,
        settings: {
            dft: false
        },
        gui: {
            group: "perspective",
            order: 0
        }
    },
    interpolation: {
        name: translate("commands.perspective.args.interpolation.name"),
        desc: translate("commands.perspective.args.interpolation.desc"),
        type: "string",
        required: false,
        settings: {
            allowed: {
                linear: translate("argValues.easingStyle.linear"),
                cubic: translate("argValues.easingStyle.cubic")
            },
            dft: "linear"
        },
        gui: {
            group: "perspective",
            order: 1
        }
    },
    tlX: {
        name: translate("commands.perspective.args.tlX.name"),
        desc: translate("commands.perspective.args.tlX.desc"),
        type: "pixels",
        required: false,
        settings: {
            dft: 0,
            base: (args) => args.input?.width,
            round: true
        },
        gui: {
            more: true,
            group: "top",
            order: 0,
            width: 50
        }
    },
    tlY: {
        name: translate("commands.perspective.args.tlY.name"),
        desc: translate("commands.perspective.args.tlY.desc"),
        type: "pixels",
        required: false,
        settings: {
            dft: 0,
            base: (args) => args.input?.height,
            round: true
        },
        gui: {
            more: true,
            group: "top",
            order: 1,
            width: 50
        }
    },
    trX: {
        name: translate("commands.perspective.args.trX.name"),
        desc: translate("commands.perspective.args.trX.desc"),
        type: "pixels",
        required: false,
        settings: {
            dft: (args) => args.input?.width,
            base: (args) => args.input?.width,
            round: true
        },
        gui: {
            more: true,
            group: "top",
            order: 2,
            width: 50
        }
    },
    trY: {
        name: translate("commands.perspective.args.trY.name"),
        desc: translate("commands.perspective.args.trY.desc"),
        type: "pixels",
        required: false,
        settings: {
            dft: 0,
            base: (args) => args.input?.height,
            round: true
        },
        gui: {
            more: true,
            group: "top",
            order: 3,
            width: 50
        }
    },
    blX: {
        name: translate("commands.perspective.args.blX.name"),
        desc: translate("commands.perspective.args.blX.desc"),
        type: "pixels",
        required: false,
        settings: {
            dft: 0,
            base: (args) => args.input?.width,
            round: true
        },
        gui: {
            more: true,
            group: "bottom",
            order: 0,
            width: 50
        }
    },
    blY: {
        name: translate("commands.perspective.args.blY.name"),
        desc: translate("commands.perspective.args.blY.desc"),
        type: "pixels",
        required: false,
        settings: {
            dft: (args) => args.input?.height,
            base: (args) => args.input?.height,
            round: true
        },
        gui: {
            more: true,
            group: "bottom",
            order: 1,
            width: 50
        }
    },
    brX: {
        name: translate("commands.perspective.args.brX.name"),
        desc: translate("commands.perspective.args.brX.desc"),
        type: "pixels",
        required: false,
        settings: {
            dft: (args) => args.input?.width,
            base: (args) => args.input?.width,
            round: true
        },
        gui: {
            more: true,
            group: "bottom",
            order: 2,
            width: 50
        }
    },
    brY: {
        name: translate("commands.perspective.args.brY.name"),
        desc: translate("commands.perspective.args.brY.desc"),
        type: "pixels",
        required: false,
        settings: {
            dft: (args) => args.input?.height,
            base: (args) => args.input?.height,
            round: true
        },
        gui: {
            more: true,
            group: "bottom",
            order: 3,
            width: 50
        }
    }
};