const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.caption.args.input.name"),
        desc: translate("commands.caption.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    text: {
        alias: "t",
        name: translate("commands.caption.args.text.name"),
        desc: translate("commands.caption.args.text.desc"),
        type: "string",
        required: false,
        settings: {
            dft: ""
        },
        gui: {
            multiline: true,
            group: "text",
            order: 0
        }
    },
    size: {
        alias: "s",
        name: translate("commands.caption.args.size.name"),
        desc: translate("commands.caption.args.size.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 1,
            min: 0
        },
        gui: {
            group: "properties",
            order: 0,
            more: true
        }
    },
    color: {
        alias: "c",
        name: translate("commands.caption.args.color.name"),
        desc: translate("commands.caption.args.color.desc"),
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
    bgColor: {
        alias: "bc",
        name: translate("commands.caption.args.bgColor.name"),
        desc: translate("commands.caption.args.bgColor.desc"),
        type: "color",
        required: false,
        settings: {
            dft: { r: 255, g: 255, b: 255 }
        },
        gui: {
            group: "properties",
            order: 2,
            more: true
        }
    },
    font: {
        alias: "f",
        name: translate("commands.caption.args.font.name"),
        desc: translate("commands.caption.args.font.desc"),
        type: "font",
        required: false,
        gui: {
            more: true
        }
    }
};