const { translate } = require("#functions/translate");

module.exports = {
    files: {
        alias: "i",
        name: translate("commands.transition.args.files.name"),
        desc: translate("commands.transition.args.files.desc"),
        type: "multi-file",
        required: true,
        settings: {
            min: 2,
            allowed: {
                type: "mime",
                list: ["image", "gif", "video"]
            }
        }
    },
    transition: {
        alias: "tr",
        name: translate("commands.transition.args.transition.name"),
        desc: translate("commands.transition.args.transition.desc"),
        type: "string",
        required: false,
        settings: {
            dft: "fade",
            allowed: {
                fade: translate("argValues.transition.fade"),
                none: translate("argValues.transition.none"),
                random: translate("argValues.transition.random"),
                wipeLeft: translate("argValues.transition.wipeLeft"),
                wipeRight: translate("argValues.transition.wipeRight"),
                wipeUp: translate("argValues.transition.wipeUp"),
                wipeDown: translate("argValues.transition.wipeDown"),
                slideLeft: translate("argValues.transition.slideLeft"),
                slideRight: translate("argValues.transition.slideRight"),
                slideUp: translate("argValues.transition.slideUp"),
                slideDown: translate("argValues.transition.slideDown"),
                circleCrop: translate("argValues.transition.circleCrop"),
                rectCrop: translate("argValues.transition.rectCrop"),
                distance: translate("argValues.transition.distance"),
                fadeBlack: translate("argValues.transition.fadeBlack"),
                fadeWhite: translate("argValues.transition.fadeWhite"),
                radial: translate("argValues.transition.radial"),
                smoothLeft: translate("argValues.transition.smoothLeft"),
                smoothRight: translate("argValues.transition.smoothRight"),
                smoothUp: translate("argValues.transition.smoothUp"),
                smoothDown: translate("argValues.transition.smoothDown"),
                circleOpen: translate("argValues.transition.circleOpen"),
                circleClose: translate("argValues.transition.circleClose"),
                vertOpen: translate("argValues.transition.vertOpen"),
                vertClose: translate("argValues.transition.vertClose"),
                horzOpen: translate("argValues.transition.horzOpen"),
                horzClose: translate("argValues.transition.horzClose"),
                dissolve: translate("argValues.transition.dissolve"),
                pixelize: translate("argValues.transition.pixelize"),
                diagTl: translate("argValues.transition.diagTl"),
                diagTr: translate("argValues.transition.diagTr"),
                diagBl: translate("argValues.transition.diagBl"),
                diagBr: translate("argValues.transition.diagBr"),
                hlSlice: translate("argValues.transition.hlSlice"),
                hrSlice: translate("argValues.transition.hrSlice"),
                vuSlice: translate("argValues.transition.vuSlice"),
                vdSlice: translate("argValues.transition.vdSlice")
            }
        }
    },
    duration: {
        alias: ["d", "t"],
        name: translate("commands.transition.args.duration.name"),
        desc: translate("commands.transition.args.duration.desc"),
        type: "number",
        required: false,
        settings: {
            dft: 1,
            min: 0
        },
        gui: {
            group: "duration",
            order: 0
        }
    },
    waitMode: {
        alias: "mode",
        name: translate("commands.transition.args.waitMode.name"),
        desc: translate("commands.transition.args.waitMode.desc"),
        type: "string",
        required: false,
        settings: {
            dft: "clone",
            allowed: {
                clone: translate("argValues.waitMode.clone"),
                add: translate("argValues.waitMode.add")
            }
        },
        gui: {
            group: "duration",
            order: 1
        }
    },
    fadeAudio: {
        alias: "fade",
        name: translate("commands.transition.args.fadeAudio.name"),
        desc: translate("commands.transition.args.fadeAudio.desc"),
        type: "boolean",
        required: false,
        settings: {
            dft: true
        },
        gui: {
            group: "duration",
            order: 2
        }
    },
    waitUntilStart: {
        alias: "ws",
        name: translate("commands.transition.args.waitUntilStart.name"),
        desc: translate("commands.transition.args.waitUntilStart.desc"),
        type: "boolean",
        required: false,
        settings: {
            dft: false
        },
        gui: {
            group: "waitConfig",
            order: 0
        }
    },
    waitUntilEnd: {
        alias: "we",
        name: translate("commands.transition.args.waitUntilEnd.name"),
        desc: translate("commands.transition.args.waitUntilEnd.desc"),
        type: "boolean",
        required: false,
        settings: {
            dft: false
        },
        gui: {
            group: "waitConfig",
            order: 1
        }
    }
};