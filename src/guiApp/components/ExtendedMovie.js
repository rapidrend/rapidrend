const { QPixmap, QSize, AspectRatioMode, TransformationMode } = require("@nodegui/nodegui");

const FileInfo = require("#classes/FileInfo");

const { performance } = require("perf_hooks");
const fs = require("fs-extra");

const { execPromise, lowestFps } = require("#functions/media");
const { divisionString } = require("#functions/math");

class ExtendedMovie {
    constructor() {
        this.rawFrames = [];
        this.pixmaps = [];
        this.scaledPixmaps = [];
        this.current = 0;
        this.running = false;
        this.listeners = [];
    }

    async setFileName(fileInfo) {
        if (fileInfo instanceof FileInfo) this.fileInfo = fileInfo;
        else this.fileInfo.path = fileInfo;

        this.rawFrames = [];
        this.pixmaps = [];
        this.scaledPixmaps = [];
        this.current = 0;

        if (this.ffmpegProcess) process.kill(this.ffmpegProcess.pid);

        if (!fs.existsSync(this.fileInfo.path)) return;

        const fps = lowestFps(this.fileInfo.fps, 24);
        this.frameInterval = 1000 / divisionString(fps);

        return new Promise(async (resolve) => {
            let ffmpegProcess;
            let buffer;

            await execPromise(`ffmpeg -ss ${Math.max(this.fileInfo.duration / 2 - 1, 0)} \
                -t 2 -i "${fileInfo.path}" \
                -vf "fps=${fps},scale='min(400,iw)':'min(400,ih)':force_original_aspect_ratio=decrease" \
                -f image2pipe -vcodec png -`, {
                proc: (proc) => {
                    ffmpegProcess = this.ffmpegProcess = proc;
                },

                stdout: (chunk) => {
                    if (!buffer) buffer = chunk;
                    else buffer = Buffer.concat([buffer, chunk]);

                    const bufferEnd = buffer.indexOf(Buffer.from([0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]));
                    if (bufferEnd === -1) return;

                    const pngBuffer = buffer.slice(0, bufferEnd + 8);
                    buffer = buffer.slice(bufferEnd + 8);
                    this.rawFrames.push(pngBuffer);

                    if (this.rawFrames.length <= 1) {
                        this.currentPixmap();
                        resolve();
                    }
                }
            });

            if (this.ffmpegProcess?.pid == ffmpegProcess.pid)
                delete this.ffmpegProcess;
        });
    }

    setLabel(movieLabel) {
        this.movieLabel = movieLabel;
    }

    setScaledSize(size) {
        this.size = size;
    }

    currentPixmap() {
        let index = this.current;
        let currentPixmap = this.scaledPixmaps[index];

        if (!currentPixmap) {
            const pngBuffer = this.rawFrames[index];
            if (!pngBuffer) return;

            currentPixmap = new QPixmap();
            currentPixmap.loadFromData(pngBuffer);

            this.pixmaps.push(currentPixmap);
            this.scaledPixmaps.push(currentPixmap);

            if (this.pixmaps.length <= 1)
                this.size = new QSize(this.fileInfo.width, this.fileInfo.height);
        }

        if (
            currentPixmap.width() != this.size.width() ||
            currentPixmap.height() != this.size.height()
        ) {
            currentPixmap = this.pixmaps[index].scaled(
                this.size.width(),
                this.size.height(),
                AspectRatioMode.IgnoreAspectRatio,
                TransformationMode.FastTransformation
            );
            this.scaledPixmaps[index] = currentPixmap;
        }

        return currentPixmap;
    }

    addEventListener(signal, callback) {
        if (signal == "frameChanged") this.listeners.push(callback);
    }

    start() {
        if (this.running) return;
        this.running = true;

        let nextFrameTime = performance.now() + this.frameInterval;

        const tick = () => {
            if (!this.running) return;

            const now = performance.now();
            if (now >= nextFrameTime) {
                let currentPixmap = this.currentPixmap();

                if (this.movieLabel && currentPixmap)
                    this.movieLabel.setPixmap(currentPixmap);

                this.listeners.forEach(listener => listener(currentPixmap));

                this.current = (this.current + 1) % this.rawFrames.length;

                nextFrameTime += this.frameInterval;
            }

            const drift = now - nextFrameTime;
            const delay = Math.max(0, this.frameInterval - drift);

            setTimeout(tick, delay);
        };

        tick();
    }

    delete() {
        this.running = false;
        this.decoding = false;
        delete this.movieLabel;
    }
}

module.exports = ExtendedMovie;