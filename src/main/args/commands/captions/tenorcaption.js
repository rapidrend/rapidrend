const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.tenorcaption.args.input.name"),
        desc: translate("commands.tenorcaption.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    topText: {
        alias: "t",
        name: translate("commands.tenorcaption.args.topText.name"),
        desc: translate("commands.tenorcaption.args.topText.desc"),
        type: "string",
        required: false,
        settings: {
            dft: ""
        },
        gui: {
            multiline: true,
            group: "topText",
            order: 0
        }
    },
    bottomText: {
        alias: "t",
        name: translate("commands.tenorcaption.args.bottomText.name"),
        desc: translate("commands.tenorcaption.args.bottomText.desc"),
        type: "string",
        required: false,
        settings: {
            dft: ""
        },
        gui: {
            multiline: true,
            group: "bottomText",
            order: 0
        }
    },
    size: {
        alias: "s",
        name: translate("commands.tenorcaption.args.size.name"),
        desc: translate("commands.tenorcaption.args.size.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 1,
            min: 0
        },
        gui: {
            group: "size",
            order: 0,
            more: true
        }
    },
    borderSize: {
        alias: "bs",
        name: translate("commands.tenorcaption.args.borderSize.name"),
        desc: translate("commands.tenorcaption.args.borderSize.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 1,
            min: 0
        },
        gui: {
            group: "size",
            order: 1,
            more: true
        }
    },
    color: {
        alias: "c",
        name: translate("commands.tenorcaption.args.color.name"),
        desc: translate("commands.tenorcaption.args.color.desc"),
        type: "color",
        required: false,
        settings: {
            dft: { r: 255, g: 255, b: 255 }
        },
        gui: {
            group: "color",
            order: 0,
            more: true
        }
    },
    borderColor: {
        alias: "bc",
        name: translate("commands.tenorcaption.args.borderColor.name"),
        desc: translate("commands.tenorcaption.args.borderColor.desc"),
        type: "color",
        required: false,
        settings: {
            dft: { r: 0, g: 0, b: 0 }
        },
        gui: {
            group: "color",
            order: 1,
            more: true
        }
    },
    font: {
        alias: "f",
        name: translate("commands.tenorcaption.args.font.name"),
        desc: translate("commands.tenorcaption.args.font.desc"),
        type: "font",
        required: false,
        gui: {
            more: true
        }
    }
};