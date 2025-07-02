const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.contract.args.input.name"),
        desc: translate("commands.contract.args.input.desc"),
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
        name: translate("commands.contract.args.multiplier.name"),
        desc: translate("commands.contract.args.multiplier.desc"),
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
        name: translate("commands.contract.args.direction.name"),
        desc: translate("commands.contract.args.direction.desc"),
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
    originY: {
        alias: "oy",
        name: translate("commands.contract.args.originY.name"),
        desc: translate("commands.contract.args.originY.desc"),
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
        alias: "ox",
        name: translate("commands.contract.args.originX.name"),
        desc: translate("commands.contract.args.originX.desc"),
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
    }
};