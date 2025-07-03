const fs = require("fs-extra");
const os = require("os");
const path = require("path");

function regexClean(str) {
    return str.replace(/[\\^$.|?*+()[{]/g, (match) => `\\${match}`)
}

function digitRegex(filename) {
    filename = regexClean(filename)

    const digRegName = filename.replace(/%(0[0-9])?d/g, (dmatch) => {
        dmatch = dmatch.substring(1)
        if (dmatch.substring(0, dmatch.length - 1))
            return `[0-9]{${dmatch.substring(1, dmatch.length - 1)}}`
        else
            return `[0-9]`
    })

    return new RegExp(digRegName)
}

function dirName(filedir) {
    const dirsplit = filedir.split("/")
    const name = dirsplit.splice(dirsplit.length - 1, 1)[0]
    const dir = dirsplit.join("/")

    return [dir, name]
}

module.exports = {
    inputs: {
        ffmpeg: (args) => {
            const inputs = {}

            for (let i in args) {
                const arg = args[i]

                if (arg == "-i") {
                    const file = args[Number(i) + 1]

                    if (file.match(/^temp(files)?\//)) {
                        const [dir, name] = dirName(file)
                        const nameregex = digitRegex(name)

                        if (fs.existsSync(dir)) fs.readdirSync(dir).forEach(file => {
                            if (file.match(nameregex)) {
                                inputs[`${dir}/${file}`] = fs.readFileSync(`${dir}/${file}`).toString("base64")

                                if (file.endsWith(".txt")) {
                                    const txtfiles = fs.readFileSync(`${dir}/${file}`).toString().trim().split("\n")

                                    txtfiles.forEach(txtfile => {
                                        if (txtfile.startsWith("file")) {
                                            const file = txtfile.substring(6, txtfile.length - 1)

                                            if (fs.existsSync(`${dir}/${file}`)) inputs[`${dir}/${file}`] = fs.readFileSync(`${dir}/${file}`).toString("base64")
                                        }
                                    })
                                }
                            }
                        })
                    }
                }
            }

            return inputs
        },

        ffprobe: (args) => {
            if (args[args.length - 1].match(/^temp(files)?\//) && fs.existsSync(args[args.length - 1]))
            return {
                [args[args.length - 1]]: fs.readFileSync(args[args.length - 1]).toString("base64")
            };

            return {};
        },

        magick: (args) => {
            const inputs = {};

            for (let i in args) {
                const file = args[i];

                if (file.match(/^temp(files)?\//)) {
                    const [dir, name] = dirName(file);
                    const nameregex = digitRegex(name);

                    if (fs.existsSync(dir)) fs.readdirSync(dir).forEach(file => {
                        if (file.match(nameregex))
                            inputs[`${dir}/${file}`] = fs.readFileSync(`${dir}/${file}`).toString("base64");
                    });
                } else if (file.match(/^https?:|"/)) break;
            }

            return inputs;
        },

        gifsicle: (args) => {
            if (args[args.length - 1].match(/^temp(files)?\//) && fs.existsSync(args[args.length - 1]))
            return {
                [args[args.length - 1]]: fs.readFileSync(args[args.length - 1]).toString("base64")
            };

            return {};
        },

        gmic: (args) => {
            const inputs = {};

            for (let i in args) {
                const file = args[i];

                if (file.match(/^temp(files)?\//)) {
                    const [dir, name] = dirName(file);
                    const nameregex = digitRegex(name);

                    if (fs.existsSync(dir)) fs.readdirSync(dir).forEach(file => {
                        if (file.match(nameregex))
                            inputs[`${dir}/${file}`] = fs.readFileSync(`${dir}/${file}`).toString("base64");
                        });
                } else if (file.match(/^https?:|"/)) break;
            }

            return inputs;
        },

        vocoder: (args) => {
            const inputs = {};

            if (args[args.length - 3].match(/^temp(files)?\//) && fs.existsSync(args[args.length - 3]))
                inputs[args[args.length - 3]] = fs.readFileSync(args[args.length - 3]).toString("base64");

            if (args[args.length - 2].match(/^temp(files)?\//) && fs.existsSync(args[args.length - 2]))
                inputs[args[args.length - 2]] = fs.readFileSync(args[args.length - 2]).toString("base64");

            return inputs;
        }
    },

    outputs: {
        ffmpeg: (args) => args[args.length - 1],
        magick: (args) => args[args.length - 1],
        gifsicle: (args) => args[args.indexOf("-o") + 1],
        gmic: (args) => args[args.indexOf("output") + 1],
        vocoder: (args) => args[args.length - 1]
    },

    alt: {
        ffmpeg: () => path.join(__appPath, "bin", "ffmpeg", `ffmpeg${os.platform() == "win32" ? ".exe" : ""}`),
        ffprobe: () => path.join(__appPath, "bin", "ffmpeg", `ffprobe${os.platform() == "win32" ? ".exe" : ""}`),
        gmic: () => path.join(__appPath, "bin", "gmic", `gmic${os.platform() == "win32" ? ".exe" : ""}`),
        magick: () => path.join(__appPath, "bin", "magick", `magick${os.platform() == "win32" ? ".exe" : ""}`)
    }
}