const { translate } = require("#functions/translate");

module.exports = {
    name: {
        name: translate("commands.localcommand.args.name.name"),
        desc: translate("commands.localcommand.args.name.desc"),
        type: "string",
        required: true,
        settings: {
            dft: ""
        }
    },

    description: {
        name: translate("commands.localcommand.args.description.name"),
        desc: translate("commands.localcommand.args.description.desc"),
        type: "string",
        settings: {
            dft: ""
        }
    },

    args: {
        name: translate("commands.localcommand.args.args.name"),
        desc: translate("commands.localcommand.args.args.desc"),
        type: "arguments",
        settings: {
            objectify: true,
            columns: {
                name: {
                    name: translate("commands.localcommand.args.args.columns.name.name"),
                    desc: translate("commands.localcommand.args.args.columns.name.desc"),
                    type: "string",
                    settings: {
                        dft: ""
                    }
                },
                desc: {
                    name: translate("commands.localcommand.args.args.columns.desc.name"),
                    desc: translate("commands.localcommand.args.args.columns.desc.desc"),
                    type: "string",
                    settings: {
                        dft: ""
                    }
                },
                type: {
                    name: translate("commands.localcommand.args.args.columns.type.name"),
                    desc: translate("commands.localcommand.args.args.columns.type.desc"),
                    type: "string",
                    settings: {
                        allowed: {
                            string: translate("argValues.argType.string"),
                            integer: translate("argValues.argType.integer"),
                            number: translate("argValues.argType.number"),
                            boolean: translate("argValues.argType.boolean"),
                            file: translate("argValues.argType.file")
                        },
                        dft: "string"
                    }
                },
                required: {
                    name: translate("commands.localcommand.args.args.columns.required.name"),
                    desc: translate("commands.localcommand.args.args.columns.required.desc"),
                    type: "boolean",
                    settings: {
                        dft: false
                    }
                },
                settings: {
                    name: translate("commands.localcommand.args.args.columns.settings.name"),
                    desc: translate("commands.localcommand.args.args.columns.settings.desc"),
                    type: "object",
                    settings: {
                        dft: {}
                    },
                    field: {
                        hide: true
                    }
                },
                dft: {
                    name: translate("commands.localcommand.args.args.columns.dft.name"),
                    desc: translate("commands.localcommand.args.args.columns.dft.desc"),
                    type: (args) => args.type == "integer" ? "number" : args.type,
                    settings: (args) => ({
                        dft: null,
                        round: args.type == "integer" ? true : false
                    }),
                    field: {
                        object: "settings"
                    }
                },
                round: {
                    name: translate("commands.localcommand.args.args.columns.round.name"),
                    desc: translate("commands.localcommand.args.args.columns.round.desc"),
                    type: "boolean",
                    settings: (args) => ({
                        dft: args.type == "integer" ? true : false 
                    }),
                    field: {
                        object: "settings",
                        hide: true
                    }
                }
            }
        },
        gui: {
            order: 0,
            group: "args"
        }
    },

    phrase: {
        name: translate("commands.localcommand.args.phrase.name"),
        desc: translate("commands.localcommand.args.phrase.desc"),
        type: "string",
        required: true,
        raw: true,
        settings: {
            dft: ""
        },
        gui: {
            multiline: true,
            mono: true,
            tab: false,
            extraHeight: 100
        }
    }
};