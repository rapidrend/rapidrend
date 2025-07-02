const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.motivator.args.input.name"),
        desc: translate("commands.motivator.args.input.desc"),
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
        name: translate("commands.motivator.args.topText.name"),
        desc: translate("commands.motivator.args.topText.desc"),
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
        name: translate("commands.motivator.args.bottomText.name"),
        desc: translate("commands.motivator.args.bottomText.desc"),
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
    color: {
        alias: "c",
        name: translate("commands.motivator.args.color.name"),
        desc: translate("commands.motivator.args.color.desc"),
        type: "color",
        required: false,
        settings: {
            dft: { r: 255, g: 255, b: 255 }
        },
        gui: {
            group: "properties",
            order: 0,
            more: true
        }
    },
    bgColor: {
        alias: "bc",
        name: translate("commands.motivator.args.bgColor.name"),
        desc: translate("commands.motivator.args.bgColor.desc"),
        type: "color",
        required: false,
        settings: {
            dft: { r: 0, g: 0, b: 0 }
        },
        gui: {
            group: "properties",
            order: 1,
            more: true
        }
    },
    topFont: {
        alias: "tf",
        name: translate("commands.motivator.args.topFont.name"),
        desc: translate("commands.motivator.args.topFont.desc"),
        type: "font",
        required: false,
        gui: {
            group: "topFont",
            order: 0,
            more: true
        }
    },
    bottomFont: {
        alias: "bf",
        name: translate("commands.motivator.args.bottomFont.name"),
        desc: translate("commands.motivator.args.bottomFont.desc"),
        type: "font",
        required: false,
        gui: {
            group: "bottomFont",
            order: 0,
            more: true
        }
    }
};