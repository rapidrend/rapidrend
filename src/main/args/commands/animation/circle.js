const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.circle.args.input.name"),
        desc: translate("commands.circle.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },

    duration: {
        alias: ["d", "t"],
        name: translate("commands.circle.args.duration.name"),
        desc: translate("commands.circle.args.duration.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 2,
            min: 0.05
        }
    },

    width: {
        alias: "w",
        name: translate("commands.circle.args.width.name"),
        desc: translate("commands.circle.args.width.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 300,
            min: 1,
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
        name: translate("commands.circle.args.height.name"),
        desc: translate("commands.circle.args.height.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 300,
            min: 1,
            round: true
        },
        gui: {
            more: true,
            group: "scale",
            order: 1
        }
    },

    fileWidth: {
        alias: "fw",
        name: translate("commands.circle.args.fileWidth.name"),
        desc: translate("commands.circle.args.fileWidth.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 100,
            min: 1,
            round: true
        },
        gui: {
            more: true,
            group: "fileScale",
            order: 0
        }
    },

    fileHeight: {
        alias: "fh",
        name: translate("commands.circle.args.fileHeight.name"),
        desc: translate("commands.circle.args.fileHeight.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 100,
            min: 1,
            round: true
        },
        gui: {
            more: true,
            group: "fileScale",
            order: 1
        }
    }
};