const path = require("path");
const fs = require("fs-extra");
const commandExists = require("command-exists").sync;

const axios = require("axios");
const whatwg = require("whatwg-url");
const fileType = require("file-type");
const { spawn } = require("child_process");

const { infoPost } = require("./general");
const { translate } = require("./translate");

const FileInfo = require("#classes/FileInfo");

const { gifFormats, validUrl, cmdRegex } = require("#variables");
const processingTools = require("#utils/processingTools");
const { divisionString } = require("./math");

async function validateFile(filePath, { allowed = null } = {}) {
    //const config = require("./modules")
    return new Promise(async (resolve, reject) => {
        const rej = reject
        reject = (val) => rej(`${translate("infoPost.cantProcessFile")} - ${val}`)

        infoPost(translate("infoPost.validateFile"))

        const isURL = validUrl.test(filePath);
        const response = isURL && await axios({
            method: "GET",
            url: filePath,
            responseType: "stream",
            validateStatus: () => true,
            maxBodyLength: 1024 * 1024 * 200,
            maxContentLength: 1024 * 1024 * 200
        }).catch(() => { });

        if (
            isURL
            ? response.status < 200 || response.status >= 300
            : !fs.existsSync(filePath) || fs.lstatSync(filePath).isDirectory()
        ) {
            reject(`${translate("errorMessages.fileNotFound")}: ${filePath}`);
            return;
        }

        let headers = response?.headers;
        let type = await (
            isURL
            ? fileType.fromStream(response.data)
            : fileType.fromFile(filePath)
        ).catch(() => { });

        let buffer = !isURL && fs.readFileSync(filePath);

        if (!type) {
            if (isURL) {
                const contentType = headers["Content-Type"] || headers["content-type"];
                const mime = contentType.match(/[^;]+/);
                type = { mime: mime[0], ext: mime[0].split("/")[1] };
            } else {
                const body = buffer.toString();
                type = {
                    mime: body.match(/<[a-z][\s\S]*>([\s\S]*)<\/[a-z][\s\S]*>/g)
                        ? "text/html" : "text/plain",
                    ext: body.match(/<[a-z][\s\S]*>([\s\S]*)<\/[a-z][\s\S]*>/g)
                        ? "html" : "plain"
                };
            }
        }

        let info = {
            size: 0,
            sizeBytes: 0,

            width: 0,
            height: 0,

            frames: 1,
            fps: "0/0",
            pixFmt: "unk",

            duration: 0,
            audioDuration: 0,

            audio: false
        };

        let shortType, shortExt, shortPixFmt;

        const typeMatch = type.mime.match(/image|video|audio/)
        if (typeMatch) {
            switch (typeMatch[0]) {
                case "image":
                    if (gifFormats.find(f => f === type.ext)) {
                        shortType = "gif"
                        shortExt = "gif"
                        shortPixFmt = "bgra"
                    } else {
                        shortType = "image";
                        shortExt = "png";
                        shortPixFmt = "rgba";
                    }
                    break;

                case "video":
                    shortType = "video";
                    shortExt = "mp4";
                    shortPixFmt = "yuv420p";
                    break;

                case "audio":
                    shortType = "audio";
                    shortExt = "mp3";
                    shortPixFmt = "unk";
                    break;
            }
        } else {
            shortType = type.mime.split("/")[0]
            shortExt = type.ext
            shortPixFmt = "unk"
        }

        if (allowed) {
            switch (allowed.type) {
                case "mime":
                    if (!allowed.list.includes(shortType)) {
                        reject(`${translate("errorMessages.unsupportedFileType")} ${shortType}.`)
                        return
                    }
                    break

                case "ext":
                    if (!allowed.list.includes(shortExt)) {
                        reject(`${translate("errorMessages.unsupportedFileExt")} ${shortExt}.`)
                        return
                    }
                    break
            }
        }

        if (isURL) {
            buffer = (await axios({
                method: "GET",
                url: filePath,
                responseType: "arraybuffer",
                validateStatus: () => true,
                maxBodyLength: 1024 * 1024 * 200,
                maxContentLength: 1024 * 1024 * 200
            }).catch(() => { }))?.data;

            const contentLength = headers["content-length"] || headers["Content-Length"];

            if (contentLength) {
                info.size = Number(contentLength) / 1048576;
                info.sizeBytes = Number(contentLength);
            } else {
                info.size = buffer.length / 1048576;
                info.sizeBytes = buffer.length;
            }
        } else {
            info.size = buffer.length / 1048576;
            info.sizeBytes = buffer.length;
        }

        const json = await execPromise(`ffprobe -of json -show_streams -show_format "${filePath}"`);
        if (json) {
            try {
                const jsoninfo = JSON.parse(json)
                if (jsoninfo.streams) {
                    const videoStream = jsoninfo.streams.find(stream => stream.codec_type === "video");
                    const audioStream = jsoninfo.streams.find(stream => stream.codec_type === "audio");

                    if (shortType == "gif" || shortType == "video") {
                        info.frames = Number(videoStream.nb_frames || 0)
                        info.fps = videoStream.r_frame_rate || "0/0";
                    }

                    if (shortType == "video" || shortType == "audio")
                        info.audio = !!audioStream;
                    
                    if (shortType == "gif" || shortType == "video" || shortType == "audio")
                        info.duration = Number((videoStream || audioStream).duration || 0);

                    if ((shortType == "video" || shortType == "audio") && info.audio)
                        info.audioDuration = Number(audioStream.duration || 0);

                    if (shortType == "image" || shortType == "gif" || shortType == "video") {
                        info.width = videoStream.width || 0;
                        info.height = videoStream.height || 0;
                        info.pixFmt = videoStream.pix_fmt || "unk";
                    }
                }
            } catch {}
        }

        let name = !isURL && path.basename(filePath);
        if (isURL) {
            const parsedUrl = whatwg.parseURL(filePath);
            name = parsedUrl.path[parsedUrl.path.length - 1];

            const contentDisposition = headers["content-disposition"];
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch)
                    name = filenameMatch[1];
            }
        }

        infoPost(translate("infoPost.fileValidated", name));

        const fileInfo = new FileInfo({
            path: filePath, name, type, buffer,
            shortType, shortExt, shortPixFmt,
            ...info
        });

        resolve(fileInfo);
    })
}

function scaledDimensions(currentSize, maxSize, scaleUp) {
    const width = (
        typeof currentSize.width == "function" ? currentSize.width() : currentSize.width
    ) ?? currentSize;
    const height = (
        typeof currentSize.height == "function" ? currentSize.height() : currentSize.height
    ) ?? currentSize;

    const availableWidth = (
        typeof maxSize.width == "function" ? maxSize.width() : maxSize.width
    ) ?? maxSize;
    const availableHeight = (
        typeof maxSize.height == "function" ? maxSize.height() : maxSize.height
    ) ?? maxSize;

    const aspectRatio = width / height;

    let scaledWidth = availableWidth;
    let scaledHeight = availableHeight;

    if (availableWidth / aspectRatio > availableHeight)
        scaledWidth = Math.round(availableHeight * aspectRatio);
    else
        scaledHeight = Math.round(availableWidth / aspectRatio);

    if (scaledWidth > width && scaledHeight > height && !scaleUp)
        return { width, height };

    return { width: scaledWidth, height: scaledHeight };
}

function highestFps(...fps) {
    let highestFps = "0/0";
    let highestFpsValue = 0;

    for (const currentFps of fps) {
        const currentFpsValue = divisionString(currentFps);

        if (currentFpsValue > highestFpsValue) {
            highestFps      = currentFps;
            highestFpsValue = currentFpsValue;
        }
    }

    return highestFps;
}

function lowestFps(...fps) {
    let lowestFps = "0/0";
    let lowestFpsValue = Infinity;

    for (const currentFps of fps) {
        const currentFpsValue = divisionString(currentFps);

        if (currentFpsValue < lowestFpsValue) {
            lowestFps      = currentFps;
            lowestFpsValue = currentFpsValue;
        }
    }

    return lowestFps;
}

async function fetchImages(query, safe) {
    return new Promise(async (resolve) => {
        gis({
            searchTerm: query,
            queryStringAddition: `&safe=${safe ? "active" : "images"}`
        }, async function (_, results) {
            const images = [];

            for (let i in results) {
                const result = results[i]
                const url = result.url.replace(/\\u([a-z0-9]){4}/g, (match) => {
                    return String.fromCharCode(Number("0x" + match.substring(2, match.length)));
                });

                images.push(url);
            }

            resolve(images);
        });
    });
}

async function execPromise(code, callbacks) {
    return new Promise(async (resolve, reject) => {
        const exargs = code.split(" ");
        const altBinary = processingTools.alt[exargs[0]];

        if (!commandExists(exargs[0]) && altBinary) {
            exargs[0] = altBinary();

            if (!fs.existsSync(exargs[0]) && !commandExists(exargs[0])) {
                reject(`${exargs[0]} does not exist.`);
                return;
            }

            exargs[0] = `"${exargs[0]}"`;
        }

        code = exargs.join(" ");

        const args = code.match(cmdRegex).map(arg => {
            if (arg.match(/^.*"(?:[^"\\]|\\.)*".*$/)) {
                return arg.replace(/(?<!\\)"/g, "");
            } else {
                return arg;
            }
        });

        const command = args.splice(0, 1)[0];

        let stdout = [];
        let stderr = [];
        let exited = false;

        const proc = spawn(command, args);
        proc.startTime = Date.now();

        app.childProcesses[proc.pid] = proc;
        app.emitters.childProcess.emit("create", proc);
        if (callbacks?.proc) callbacks.proc(proc);

        function handleExit() {
            if (!exited) return;
            const out = stdout.join("\n") || stderr.join("\n");
            proc.removeAllListeners();
            delete app.childProcesses[proc.pid];
            app.emitters.childProcess.emit("end", proc);
            resolve(out);
        }

        proc.stdout.on("data", (buffer) => {
            if (callbacks?.stdout) callbacks.stdout(buffer);
            if (!buffer.toString()) return;
            stdout.push(buffer.toString());
        });

        proc.stderr.on("data", (buffer) => {
            if (callbacks?.stderr) callbacks.stderr(buffer);
            if (!buffer.toString()) return;
            infoPost(buffer.toString());
            stderr.push(buffer.toString());
        });

        proc.stdout.on("close", () => {
            exited = true;
            handleExit();
        });

        proc.stderr.on("close", () => {
            exited = true;
            handleExit();
        });

        proc.on("error", (err) => {
            proc.removeAllListeners();
            resolve(err.message);
        });

        proc.on("exit", () => {
            exited = true;
            handleExit();
        });
    });
}

module.exports = {
    validateFile,
    scaledDimensions,
    highestFps,
    lowestFps,
    fetchImages,
    execPromise
};