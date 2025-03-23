const path = require("path");
const fs = require("fs-extra");
const commandExists = require("command-exists").sync;

const axios = require("axios");
const whatwg = require("whatwg-url");
const fileType = require("file-type");
const { spawn } = require("child_process");

const { infoPost } = require("./general");
const { translate } = require("./translate");

const { gifFormats, validUrl } = require("#variables");
const processingTools = require("#utils/processingTools");

const functions = {
    async validateFile(filePath, { allowed = null } = {}) {
        //const config = require("./modules")
        return new Promise(async (resolve, reject) => {
            const rej = reject
            reject = function (val) {
                infoPost(`${translate("infoPost.cantProcessFile")}: ${val}`)
                rej(val)
            }

            infoPost(translate("infoPost.validateFile"))

            /*if ((process.memoryUsage().rss / 1024 / 1024) <= config.memLimit) {
                reject("No resources available.")
                return
            }*/

            const isURL = validUrl.test(filePath);
            const response = isURL && await axios({
                method: "GET",
                url: filePath,
                responseType: "stream",
                validateStatus: () => true,
                maxBodyLength: 1024 * 1024 * 200,
                maxContentLength: 1024 * 1024 * 200
            }).catch(() => { });;

            if (isURL ? response.status < 200 || response.status >= 300 : !fs.existsSync(filePath) || fs.lstatSync(filePath).isDirectory()) {
                reject(`${translate("errorMessages.fileNotFound")}: ${filePath}`);
                return;
            }

            let headers = response?.headers;
            let type = await (isURL ? fileType.fromStream(response.data) : fileType.fromFile(filePath)).catch(() => { });

            let buffer = !isURL && fs.readFileSync(filePath);

            if (!type) {
                if (isURL) {
                    const contentType = headers["Content-Type"] || headers["content-type"];
                    const mime = contentType.match(/[^;]+/);
                    type = { mime: mime[0], ext: mime[0].split("/")[1] };
                } else {
                    const body = buffer.toString();
                    type = {
                        mime: body.match(/<[a-z][\s\S]*>([\s\S]*)<\/[a-z][\s\S]*>/g) ? "text/html" : "text/plain",
                        ext: body.match(/<[a-z][\s\S]*>([\s\S]*)<\/[a-z][\s\S]*>/g) ? "html" : "plain"
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

                videoDuration: "N/A",
                audioDuration: "N/A",

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

            const json = await functions.execPromise(`ffprobe -of json -show_streams -show_format "${filePath}"`)
            if (json) {
                try {
                    const jsoninfo = JSON.parse(json)
                    if (jsoninfo["streams"]) {
                        const videoStream = jsoninfo["streams"].find(stream => stream["codec_type"] === "video")
                        const audioStream = jsoninfo["streams"].find(stream => stream["codec_type"] === "audio")

                        if ((type.mime.startsWith("image") && gifFormats.find(f => f === type.ext)) || type.mime.startsWith("video")) {
                            info.frames = videoStream["nb_frames"] || 0
                            info.fps = videoStream["r_frame_rate"] || "0/0"
                        }
                        if (type.mime.startsWith("video") || type.mime.startsWith("audio")) {
                            info.audio = !!audioStream
                        }
                        if ((type.mime.startsWith("image") && gifFormats.find(f => f === type.ext)) || type.mime.startsWith("video") || type.mime.startsWith("audio")) {
                            info.videoDuration = (videoStream || audioStream)["duration"] || 0
                        }
                        if ((type.mime.startsWith("video") || type.mime.startsWith("audio")) && info.audio) {
                            info.audioDuration = audioStream["duration"] || 0
                        }
                        if (type.mime.startsWith("image") || type.mime.startsWith("video")) {
                            info.width = videoStream["width"] || 0
                            info.height = videoStream["height"] || 0
                            info.pixFmt = videoStream["pix_fmt"] || "unk"
                        }
                    }
                } catch (_) { }
            }

            let name = !isURL && path.basename(filePath);
            if (isURL) {
                const parsedUrl = whatwg.parseURL(filePath);
                name = parsedUrl.path[parsedUrl.path.length - 1];

                const contentDisposition = headers["content-disposition"];
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename=".+"/);
                    if (filenameMatch) {
                        name = filenameMatch[0].substring(10, filenameMatch[0].length - 1);
                    }
                }
            }

            infoPost(translate("infoPost.fileValidated").replace("%s", name))

            resolve({
                path: filePath, name, type, buffer,
                shortType, shortExt, shortPixFmt,
                ...info
            })
        })
    },

    async correctUrl(url) {
        if (url.match(/^https\:\/\/((cdn|media)\.)?discordapp\.(com|net)\/attachments/) && url.match(/[0-9]+/g) && process.env.DISCORD_REFRESHER_TOKEN) {
            var response = await axios({
                method: "POST",
                url: `https://discord.com/api/v9/attachments/refresh-urls`,
                data: {
                    attachment_urls: [url]
                },
                headers: {
                    "Authorization": process.env.DISCORD_REFRESHER_TOKEN,
                    "Accept": "application/json"
                }
            }).catch((e) => console.log(e))
            if (response && response.status >= 200 && response.status < 300 && response.data.refreshed_urls.length) {
                infoPost(`Discord URL detected`)
                return response.data.refreshed_urls[0].refreshed
            }
        } else if (url.match(/^https\:\/\/(www\.)?tenor\.com\/view/) && url.match(/[0-9]+/g) && process.env.TENOR_KEY) {
            var ids = url.match(/[0-9]+/g)
            var body = await axios(`https://g.tenor.com/v1/gifs?ids=${ids[ids.length - 1]}&key=${process.env.TENOR_KEY}`).catch(() => { })
            if (body && body.data.results.length) {
                infoPost(`Tenor URL detected`)
                return body.data.results[0].media[0].gif.url
            }
        } else if (url.match(/^https\:\/\/(www\.)?gyazo\.com/)) {
            var gifurl = url.replace(/^https\:\/\/(www\.)?gyazo\.com/, "https://i.gyazo.com") + ".gif"
            var mp4url = url.replace(/^https\:\/\/(www\.)?gyazo\.com/, "https://i.gyazo.com") + ".mp4"
            var pngurl = url.replace(/^https\:\/\/(www\.)?gyazo\.com/, "https://i.gyazo.com") + ".png"
            var gyazourls = [gifurl, mp4url, pngurl]
            var gyazourl = undefined
            for (var i in gyazourls) {
                var url = gyazourls[i]
                var response = await axios({
                    url: url,
                    validateStatus: () => true
                }).catch(() => { })
                if (response && response.status >= 200 && response.status < 300) {
                    gyazourl = url
                    break
                }
            }
            if (gyazourl) {
                infoPost(`Gyazo URL detected`)
                return gyazourl
            }
        } else if (url.match(/^https\:\/\/(www\.)?imgur\.com/)) {
            var mp4url = url.replace(/^https\:\/\/(www\.)?imgur\.com/, "https://i.imgur.com") + ".mp4"
            var pngurl = url.replace(/^https\:\/\/(www\.)?imgur\.com/, "https://i.imgur.com") + ".png"
            var imgurls = [mp4url, pngurl]
            var imgurl = undefined
            for (var i in imgurls) {
                var url = imgurls[i]
                var response = await axios({
                    url: url,
                    validateStatus: () => true
                }).catch(() => { })
                if (response && response.status >= 200 && response.status < 300) {
                    imgurl = url
                    break
                }
            }
            if (imgurl) {
                infoPost(`Imgur URL detected`)
                return imgurl
            }
        } else if (url.match(/^https\:\/\/(www\.)?roblox\.com\/(catalog|library|games)\//)) {
            async function getAudio(id) {
                return new Promise((resolve) => {
                    axios.get(`https://www.roblox.com/library/${id}`).then(async (res) => {
                        var $ = cheerio.load(res.data)
                        var urls = $("#AssetThumbnail .MediaPlayerIcon")

                        if (urls.length > 0) {
                            resolve(urls[0].attribs["data-mediathumb-url"])
                            return
                        }

                        resolve()
                    }).catch(() => resolve())
                })
            }

            async function getTexture(id) {
                return new Promise((resolve) => {
                    axios({
                        method: "GET",
                        url: `https://assetdelivery.roblox.com/v1/assetId/${id}`,
                        headers: {
                            "Accept": "application/json"
                        }
                    }).then(async (res) => {
                        var body = res.data
                        var rbxmurl = body.location

                        if (!rbxmurl) {
                            resolve()
                            return
                        }

                        axios(rbxmurl).then((rres) => {
                            var rbody = rres.data

                            var $ = cheerio.load(rbody)
                            var urls = $("url")
                            if (urls.length > 0) {
                                var imageasseturl = urls[0].children[0].data
                                var ids = imageasseturl.match(/[0-9]+/g)
                                var id = ids[0]

                                axios({
                                    method: "GET",
                                    url: `https://assetdelivery.roblox.com/v1/assetId/${id}`,
                                    headers: {
                                        "Accept": "application/json"
                                    }
                                }).then((ires) => {
                                    var ibody = ires.data
                                    var textureurl = ibody.location

                                    if (!textureurl) {
                                        resolve()
                                        return
                                    }

                                    resolve(textureurl)
                                }).catch(() => resolve())
                                return
                            }

                            resolve()
                        }).catch(() => resolve())
                    }).catch(() => resolve())
                })
            }

            async function getGame(id) {
                return new Promise((resolve) => {
                    axios({
                        method: "GET",
                        url: `https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${id}&size=512x512&format=Png&isCircular=false`,
                        headers: {
                            "Accept": "application/json"
                        }
                    }).then(async (res) => {
                        var body = res.data

                        if (body.data ? body.data.length > 0 : false) {
                            if (body.data[0].state === "Pending") {
                                var url = await getGame(id).catch(() => { })
                                resolve(url)
                                return
                            }

                            resolve(body.data[0].imageUrl)
                            return
                        }

                        resolve()
                    }).catch(() => resolve())
                })
            }

            async function getThumb(id) {
                return new Promise((resolve) => {
                    axios({
                        method: "GET",
                        url: `https://thumbnails.roblox.com/v1/assets?assetIds=${id}&size=700x700&format=Png&isCircular=false`,
                        headers: {
                            "Accept": "application/json"
                        }
                    }).then(async (res) => {
                        var body = res.data

                        if (body.data ? body.data.length > 0 : false) {
                            if (body.data[0].state === "Pending") {
                                var url = await getThumb(id).catch(() => { })
                                resolve(url)
                                return
                            }

                            resolve(body.data[0].imageUrl)
                            return
                        }

                        resolve()
                    }).catch(() => resolve())
                })
            }

            async function getAsset(id) {
                var info = await axios.get(`https://api.roblox.com/marketplace/productinfo?assetId=${id}`).catch(() => { })

                if (info) {
                    if (info.AssetTypeId === 3) {
                        var audiourl = await getAudio(id).catch(() => { })

                        if (audiourl) {
                            infoPost(`Roblox audio URL detected`)
                            return audiourl
                        }
                    } else if (info.AssetTypeId === 2 || info.AssetTypeId === 11 || info.AssetTypeId === 12 || info.AssetTypeId === 13) {
                        var imageurl = await getTexture(id).catch(() => { })

                        if (imageurl) {
                            infoPost(`Roblox image asset URL detected`)
                            return imageurl
                        }
                    } else if (info.AssetTypeId === 9) {
                        var gameurl = await getGame(id).catch(() => { })

                        if (gameurl) {
                            infoPost(`Roblox game icon URL detected`)
                            return gameurl
                        }
                    } else {
                        var asseturl = await getThumb(id).catch(() => { })

                        if (asseturl) {
                            infoPost(`Roblox asset URL detected`)
                            return asseturl
                        }
                    }
                }
            }

            var ids = url.match(/[0-9]+/g)
            if (ids.length) {
                var id = ids[0]
                var asseturl = await getAsset(id).catch(() => { })

                if (asseturl) return asseturl
            }
        } else if (url.match(/^https\:\/\/(www\.)?roblox\.com\/(badges)\//)) {
            async function getBadge(id) {
                return new Promise((resolve) => {
                    axios({
                        method: "GET",
                        url: `https://thumbnails.roblox.com/v1/badges/icons?badgeIds=${id}&size=150x150&format=Png&isCircular=false`,
                        headers: {
                            "Accept": "application/json"
                        }
                    }).then(async (res) => {
                        var body = res.data

                        if (body.data ? body.data.length > 0 : false) {
                            if (body.data[0].state === "Pending") {
                                var url = await getBadge(id).catch(() => { })
                                resolve(url)
                                return
                            }

                            resolve(body.data[0].imageUrl)
                            return
                        }

                        resolve()
                    }).catch(() => resolve())
                })
            }

            var ids = url.match(/[0-9]+/g)
            if (ids.length) {
                var id = ids[0]
                var badgeurl = await getBadge(id).catch(() => { })

                if (badgeurl) {
                    infoPost(`Roblox badge URL detected`)
                    return badgeurl
                }
            }
        } else if (url.match(/^https\:\/\/(www\.)?roblox\.com\/(bundles)\//)) {
            async function getBundle(id) {
                return new Promise((resolve) => {
                    axios({
                        method: "GET",
                        url: `https://thumbnails.roblox.com/v1/bundles/thumbnails?bundleIds=${id}&size=420x420&format=Png&isCircular=false`,
                        headers: {
                            "Accept": "application/json"
                        }
                    }).then(async (res) => {
                        var body = res.data

                        if (body.data ? body.data.length > 0 : false) {
                            if (body.data[0].state === "Pending") {
                                var url = await getBundle(id).catch(() => { })
                                resolve(url)
                                return
                            }

                            resolve(body.data[0].imageUrl)
                            return
                        }

                        resolve()
                    }).catch(() => resolve())
                })
            }

            var ids = url.match(/[0-9]+/g)
            if (ids.length) {
                var id = ids[0]
                var bundleurl = await getBundle(id).catch(() => { })

                if (bundleurl) {
                    infoPost(`Roblox bundle URL detected`)
                    return bundleurl
                }
            }
        } else if (url.match(/^https\:\/\/(www\.)?roblox\.com\/(game-pass)\//)) {
            async function getGamePass(id) {
                return new Promise((resolve) => {
                    axios({
                        method: "GET",
                        url: `https://thumbnails.roblox.com/v1/game-passes?gamePassIds=${id}&size=150x150&format=Png&isCircular=false`,
                        headers: {
                            "Accept": "application/json"
                        }
                    }).then(async (res) => {
                        var body = res.data

                        if (body.data ? body.data.length > 0 : false) {
                            if (body.data[0].state === "Pending") {
                                var url = await getGamePass(id).catch(() => { })
                                resolve(url)
                                return
                            }

                            resolve(body.data[0].imageUrl)
                            return
                        }

                        resolve()
                    }).catch(() => resolve())
                })
            }

            var ids = url.match(/[0-9]+/g)
            if (ids.length) {
                var id = ids[0]
                var gamepassurl = await getGamePass(id).catch(() => { })

                if (gamepassurl) {
                    infoPost(`Roblox gamepass URL detected`)
                    return gamepassurl
                }
            }
        } else if (url.match(/^https\:\/\/(www\.)?roblox\.com\/(users)\//)) {
            async function getUser(id) {
                return new Promise((resolve) => {
                    axios({
                        method: "GET",
                        url: `https://thumbnails.roblox.com/v1/users/avatar?userIds=${id}&size=720x720&format=Png&isCircular=false`,
                        headers: {
                            "Accept": "application/json"
                        }
                    }).then(async (res) => {
                        var body = res.data

                        if (body.data ? body.data.length > 0 : false) {
                            if (body.data[0].state === "Pending") {
                                var url = await getUser(id).catch(() => { })
                                resolve(url)
                                return
                            }

                            resolve(body.data[0].imageUrl)
                            return
                        }

                        resolve()
                    }).catch(() => resolve())
                })
            }

            var ids = url.match(/[0-9]+/g)
            if (ids.length) {
                var id = ids[0]
                var userurl = await getUser(id).catch(() => { })

                if (userurl) {
                    infoPost(`Roblox avatar URL detected`)
                    return userurl
                }
            }
        } else if (url.match(/^https\:\/\/(www\.)?roblox\.com\/(groups)\//)) {
            async function getGroup(id) {
                return new Promise((resolve) => {
                    axios({
                        method: "GET",
                        url: `https://thumbnails.roblox.com/v1/groups/icons?groupIds=${id}&size=420x420&format=Png&isCircular=false`,
                        headers: {
                            "Accept": "application/json"
                        }
                    }).then(async (res) => {
                        var body = res.data

                        if (body.data ? body.data.length > 0 : false) {
                            if (body.data[0].state === "Pending") {
                                var url = await getGroup(id).catch(() => { })
                                resolve(url)
                                return
                            }

                            resolve(body.data[0].imageUrl)
                            return
                        }

                        resolve()
                    }).catch(() => resolve())
                })
            }

            var ids = url.match(/[0-9]+/g)
            if (ids.length) {
                var id = ids[0]
                var groupurl = await getGroup(id).catch(() => { })

                if (groupurl) {
                    infoPost(`Roblox group icon URL detected`)
                    return groupurl
                }
            }
        } else if (url.match(/^https\:\/\/((www|m)\.)?youtube\.com|^https\:\/\/(www\.)?youtu\.be/)) {
            var youtubeurl = await functions.execPromise(`yt-dlp ${url} --format 18 --get-url`).catch(() => { })

            if (youtubeurl) {
                infoPost(`YouTube video URL detected`)
                return youtubeurl.trim()
            }
        } else if (url.match(/^https\:\/\/(www|on\.)?soundcloud\.com/)) {
            var soundcloudurl = await functions.execPromise(`yt-dlp ${url} --get-url`).catch(() => { })

            if (soundcloudurl) {
                infoPost(`SoundCloud URL detected`)
                return soundcloudurl.trim()
            }
        } else if (url.match(/^https\:\/\/((www)\.)?(fx)?twitter\.com\/\w{4,15}\/status\/[0-9]+/)) {
            async function getImageUrl(url) {
                var res = await axios.get(url)
                var $ = cheerio.load(res.data)
                var urls = $("div .AdaptiveMedia-photoContainer.js-adaptive-photo")

                if (urls.length > 0) return urls[0].attribs["data-image-url"]
            }

            async function getGifUrl(url) {
                var twittergifurl = await functions.execPromise(`yt-dlp ${url} --format http --get-url`).catch(() => { })

                return twittergifurl.trim()
            }

            async function getVidUrl(url) {
                var twittervidurl = await functions.execPromise(`yt-dlp ${url} --get-url`).catch(() => { })

                return twittervidurl.trim()
            }

            var twittervidurl = await getVidUrl(url).catch(() => { })
            var twittergifurl = await getGifUrl(url).catch(() => { })
            var twitterimageurl = await getImageUrl(url).catch(() => { })

            if (twittervidurl) {
                infoPost(`Twitter video URL detected`)
                return twittervidurl
            }

            if (twittergifurl) {
                infoPost(`Twitter GIF URL detected`)
                return twittergifurl
            }

            if (twitterimageurl) {
                infoPost(`Twitter image URL detected`)
                return twitterimageurl
            }
        }

        return url
    },

    async fetchImages(query, bing, safe) {
        return new Promise(async (resolve) => {
            if (bing) {
                var options = {
                    method: "GET",
                    url: "https://bing-web-search1.p.rapidapi.com/search",
                    params: { q: query, count: "100", safeSearch: safe ? "Moderate" : "Off" },
                    headers: {
                        "X-BingApis-SDK": "true",
                        "X-RapidAPI-Host": "bing-web-search1.p.rapidapi.com",
                        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY
                    }
                }

                var response = await axios(options).catch(() => { })

                if (!response) {
                    resolve([])
                    return
                }

                if (!(response.status >= 200 && response.status < 300)) {
                    resolve([])
                    return
                }

                console.log(response.data)

                var images = []
                var body = response.data

                if (body.value ? body.value.length > 0 : false) {
                    images = body.value.map(result => result.contentUrl)
                }

                resolve(images)
            } else {
                gis({
                    searchTerm: query,
                    queryStringAddition: `&safe=${safe ? "active" : "images"}`
                }, async function (_, results) {
                    var images = []

                    for (var i in results) {
                        var result = results[i]
                        var url = result.url.replace(/\\u([a-z0-9]){4}/g, (match) => {
                            return String.fromCharCode(Number("0x" + match.substring(2, match.length)))
                        })

                        images.push(url)
                    }

                    resolve(images)
                })
            }
        })
    },

    async execPromise(code) {
        const app = global.app;

        return new Promise(async (resolve, reject) => {
            const exargs = code.split(" ");

            if (!commandExists(exargs[0]) && processingTools.alt[exargs[0]]) {
                exargs[0] = processingTools.alt[exargs[0]];

                if (!fs.existsSync(exargs[0]) && !commandExists(exargs[0])) {
                    reject(`${exargs[0]} does not exist.`);
                    return;
                }

                exargs[0] = `"${exargs[0]}"`;
            }

            code = exargs.join(" ");

            const args = code.match(/("[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|\/[^\/\\]*(?:\\[\S\s][^\/\\]*)*\/[gimy]*(?=\s|$)|(?:\\\s|\S)+)/g).map(arg => {
                if (arg.match(/^".+"$/)) return arg.slice(1, -1);
                else return arg;
            });
            const command = args.splice(0, 1)[0];

            let stdout = [];
            let stderr = [];
            let exited = false;

            const proc = spawn(command, args);

            app.childProcesses[proc.pid] = proc;

            function handleExit() {
                if (!exited) return;
                const out = stdout.join("\n") || stderr.join("\n");
                proc.removeAllListeners();
                delete app.childProcesses[proc.pid];
                resolve(out);
            }

            proc.stdout.on("data", (buffer) => {
                if (!buffer.toString()) return;
                infoPost(buffer.toString());
                stdout.push(buffer.toString());
            });

            proc.stderr.on("data", (buffer) => {
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
};

module.exports = functions;