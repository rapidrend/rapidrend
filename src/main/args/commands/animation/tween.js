const { scaledDimensions } = require("#functions/media");
const { translate } = require("#functions/translate");

module.exports = {
    files: {
        alias: "i",
        name: translate("commands.tween.args.files.name"),
        desc: translate("commands.tween.args.files.desc"),
        type: "multi-file",
        required: true,
        settings: {
            min: 1,
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    width: {
        alias: "w",
        name: translate("commands.tween.args.width.name"),
        desc: translate("commands.tween.args.width.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 300,
            min: 1,
            round: true
        },
        gui: {
            group: "settings",
            order: 0
        }
    },
    height: {
        alias: "h",
        name: translate("commands.tween.args.height.name"),
        desc: translate("commands.tween.args.height.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 300,
            min: 1,
            round: true
        },
        gui: {
            group: "settings",
            order: 1
        }
    },
    duration: {
        alias: ["d", "t"],
        name: translate("commands.tween.args.duration.name"),
        desc: translate("commands.tween.args.duration.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 1,
            min: 0.05
        },
        gui: {
            group: "settings",
            order: 2
        }
    },
    keyframes: {
        name: translate("commands.tween.args.keyframes.name"),
        desc: translate("commands.tween.args.keyframes.desc"),
        type: "arguments",
        settings: {
            columns: {
                f: {
                    name: translate("commands.tween.args.keyframes.columns.f.name"),
                    desc: translate("commands.tween.args.keyframes.columns.f.desc"),
                    type: "number",
                    settings: (_, args) => ({
                        dft: 0,
                        min: 0,
                        max: args.files?.length ?? 0
                    })
                },
                t: {
                    name: translate("commands.tween.args.keyframes.columns.t.name"),
                    desc: translate("commands.tween.args.keyframes.columns.t.desc"),
                    type: "number",
                    settings: (_, args) => ({
                        dft: 0,
                        min: 0,
                        max: args.duration
                    })
                },
                x: {
                    name: translate("commands.tween.args.keyframes.columns.x.name"),
                    desc: translate("commands.tween.args.keyframes.columns.x.desc"),
                    type: "number",
                    settings: (_, args) => ({
                        dft: (!args.keyframes || args.keyframes.length <= 0) ? 0 : null,
                        round: true,
                        allowNull: true
                    })
                },
                y: {
                    name: translate("commands.tween.args.keyframes.columns.y.name"),
                    desc: translate("commands.tween.args.keyframes.columns.y.desc"),
                    type: "number",
                    settings: (_, args) => ({
                        dft: (!args.keyframes || args.keyframes.length <= 0) ? 0 : null,
                        round: true,
                        allowNull: true
                    })
                },
                w: {
                    name: translate("commands.tween.args.keyframes.columns.w.name"),
                    desc: translate("commands.tween.args.keyframes.columns.w.desc"),
                    type: "number",
                    settings: (_, args) => ({
                        dft: (!args.keyframes || args.keyframes.length <= 0) ? (
                            args.files?.length ? scaledDimensions(args.files[0], {
                                width: Math.round(args.width / 3),
                                height: Math.round(args.height / 3)
                            }).width : 100
                        ) : null,
                        round: true,
                        allowNull: true
                    })
                },
                h: {
                    name: translate("commands.tween.args.keyframes.columns.h.name"),
                    desc: translate("commands.tween.args.keyframes.columns.h.desc"),
                    type: "number",
                    settings: (_, args) => ({
                        dft: (!args.keyframes || args.keyframes.length <= 0) ? (
                            args.files?.length ? scaledDimensions(args.files[0], {
                                width: Math.round(args.width / 3),
                                height: Math.round(args.height / 3)
                            }).height : 100
                        ) : null,
                        round: true,
                        allowNull: true
                    })
                },
                r: {
                    name: translate("commands.tween.args.keyframes.columns.r.name"),
                    desc: translate("commands.tween.args.keyframes.columns.r.desc"),
                    type: "number",
                    settings: (_, args) => ({
                        dft: (!args.keyframes || args.keyframes.length <= 0) ? 0 : null,
                        allowNull: true
                    })
                },
                o: {
                    name: translate("commands.tween.args.keyframes.columns.o.name"),
                    desc: translate("commands.tween.args.keyframes.columns.o.desc"),
                    type: "number",
                    settings: (_, args) => ({
                        min: 0,
                        max: 1,
                        dft: (!args.keyframes || args.keyframes.length <= 0) ? 1 : null,
                        allowNull: true
                    })
                },
                e: {
                    name: translate("commands.tween.args.keyframes.columns.e.name"),
                    desc: translate("commands.tween.args.keyframes.columns.e.desc"),
                    type: "string",
                    settings: {
                        allowed: {
                            linear: translate("argValues.easingStyle.linear"),
                            constant: translate("argValues.easingStyle.constant"),
                            sine: translate("argValues.easingStyle.sine"),
                            quad: translate("argValues.easingStyle.quad"),
                            cubic: translate("argValues.easingStyle.cubic"),
                            quart: translate("argValues.easingStyle.quart"),
                            quint: translate("argValues.easingStyle.quint"),
                            expo: translate("argValues.easingStyle.expo"),
                            circ: translate("argValues.easingStyle.circ"),
                            back: translate("argValues.easingStyle.back"),
                            elastic: translate("argValues.easingStyle.elastic"),
                            bounce: translate("argValues.easingStyle.bounce")
                        },
                        dft: "sine"
                    },
                },
                d: {
                    name: translate("commands.tween.args.keyframes.columns.d.name"),
                    desc: translate("commands.tween.args.keyframes.columns.d.desc"),
                    type: "string",
                    settings: {
                        allowed: {
                            in: translate("argValues.easingDirection.in"),
                            out: translate("argValues.easingDirection.out"),
                            inOut: translate("argValues.easingDirection.inOut")
                        },
                        dft: "inOut"
                    },
                }
            }
        },
        gui: {
            order: 0,
            group: "args",
            more: true
        }
    }
};