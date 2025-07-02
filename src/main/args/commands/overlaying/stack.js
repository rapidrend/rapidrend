const { translate } = require("#functions/translate");

module.exports = {
    input: {
        alias: "i",
        name: translate("commands.stack.args.input.name"),
        desc: translate("commands.stack.args.input.desc"),
        type: "file",
        required: true,
        settings: {
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    count: {
        alias: "n",
        name: translate("commands.stack.args.count.name"),
        desc: translate("commands.stack.args.count.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 1,
            min: 1,
            round: true
        },
        gui: {
            group: "stack",
            order: 0
        }
    },
    direction: {
        alias: "d",
        name: translate("commands.stack.args.direction.name"),
        desc: translate("commands.stack.args.direction.desc"),
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
            group: "stack",
            order: 1
        }
    }
};