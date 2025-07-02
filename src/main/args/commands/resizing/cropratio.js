const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.cropratio.args.input.name"),
        desc: translate("commands.cropratio.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    ratioW: {
        alias: "w",
        name: translate("commands.cropratio.args.ratioW.name"),
        desc: translate("commands.cropratio.args.ratioW.desc"),
        type: "number",
        required: true,
        settings: {
            min: 1,
            dft: 1,
            round: true
        },
        gui: {
            group: "ratio",
            order: 0
        }
    },
    ratioH: {
        alias: "h",
        name: translate("commands.cropratio.args.ratioH.name"),
        desc: translate("commands.cropratio.args.ratioH.desc"),
        type: "number",
        required: true,
        settings: {
            min: 1,
            dft: 1,
            round: true
        },
        gui: {
            group: "ratio",
            order: 1
        }
    },
    originX: {
        alias: "ox",
        name: translate("commands.cropratio.args.originX.name"),
        desc: translate("commands.cropratio.args.originX.desc"),
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
            order: 0
        }
    },
    originY: {
        alias: "oy",
        name: translate("commands.cropratio.args.originY.name"),
        desc: translate("commands.cropratio.args.originY.desc"),
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
            order: 1
        }
    }
};