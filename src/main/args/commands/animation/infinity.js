const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.infinity.args.input.name"),
        desc: translate("commands.infinity.args.input.desc"),
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
        name: translate("commands.infinity.args.duration.name"),
        desc: translate("commands.infinity.args.duration.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 2,
            min: 0.05
        }
    },

    width: {
        alias: "w",
        name: translate("commands.infinity.args.width.name"),
        desc: translate("commands.infinity.args.width.desc"),
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
        name: translate("commands.infinity.args.height.name"),
        desc: translate("commands.infinity.args.height.desc"),
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
        name: translate("commands.infinity.args.fileWidth.name"),
        desc: translate("commands.infinity.args.fileWidth.desc"),
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
        name: translate("commands.infinity.args.fileHeight.name"),
        desc: translate("commands.infinity.args.fileHeight.desc"),
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