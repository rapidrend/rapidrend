const { translate } = require("#functions/translate");

module.exports = {
    file1: {
        alias: "i",
        name: translate("commands.merge.args.file1.name"),
        desc: translate("commands.merge.args.file1.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    file2: {
        alias: "i",
        name: translate("commands.merge.args.file2.name"),
        desc: translate("commands.merge.args.file2.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    direction: {
        alias: "d",
        name: translate("commands.merge.args.direction.name"),
        desc: translate("commands.merge.args.direction.desc"),
        type: "string",
        required: false,
        settings: {
            allowed: {
                horizontal: translate("argValues.direction.horizontal"),
                vertical: translate("argValues.direction.vertical")
            },
            dft: "horizontal"
        },
        gui: {
            group: "merge",
            order: 0
        }
    },
    swap: {
        alias: "s",
        name: translate("commands.merge.args.swap.name"),
        desc: translate("commands.merge.args.swap.desc"),
        type: "boolean",
        required: false,
        settings: {
            dft: false
        },
        gui: {
            group: "merge",
            order: 1
        }
    }
};