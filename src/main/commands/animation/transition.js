const { execPromise } = require("#functions/media");
const { makeTempPath, getAsset } = require("#functions/filesystem");
const { translate } = require("#functions/translate");
const { randomChoice } = require("#functions/math");

const FileEmbed = require("#classes/FileEmbed");

module.exports = {
    name: translate("commands.transition.name"),
    description: translate("commands.transition.description"),
    category: translate("categories.animation"),
    args: require("#args/commands/animation/transition"),
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const { files, transition, duration, waitMode, fadeAudio, waitUntilEnd, waitUntilStart } = args;

        const transitions = [
            "fade", "wipeleft", "wiperight", "wipeup", "wipedown",
            "slideleft", "slideright", "slideup", "slidedown",
            "circlecrop", "rectcrop", "distance", "fadeblack",
            "fadewhite", "radial", "smoothleft", "smoothright",
            "smoothup", "smoothdown", "circleopen", "circleclose",
            "vertopen", "vertclose", "horzopen", "horzclose",
            "dissolve", "pixelize", "diagtl", "diagtr", "diagbl",
            "diagbr", "hlslice", "hrslice", "vuslice", "vdslice"
        ];
        
        const hasVideo = files.some(f => f.shortType === "video");
        const hasAudio = files.some(f => f.audio);
        const outExt = hasVideo ? "mp4" : "gif";
        const tempOut = makeTempPath(outExt);
        const tempDir = tempOut.replace(/\.[^/.]+$/, "");
        const noTransition = transition === "none" || duration === 0;

        const width = files[0].width;
        const height = files[0].height;
        const ratio = width / height;
        const fps = files[0].fps.includes("0/0") ? (hasVideo ? "60" : "50") : files[0].fps;

        const inputs = [];
        const audioInputs = [];

        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            let tmp = f.path;
            if (f.shortType === "video") {
                tmp = `${tempDir}_in${i}.mp4`;
                await execPromise(
                    `ffmpeg -y -i "${f.path}" ` +
                    `-vf "scale=ceil(iw/2)*2:ceil(ih/2)*2,fps=${fps}" ` +
                    `-c:v libx264 -pix_fmt yuv420p -c:a aac -ar 44100 -r ${fps} "${tmp}"`
                );

                if (f.audio) audioInputs.push({ label: `${i}:a`, filters: "" });
            }

            inputs.push({
                path: tmp,
                filters: f.shortType === "image" ?
                    `-stream_loop -1 -t ${noTransition ? fps : duration * (i > 0 && i < files.length - 1 ? 2 : 1)}` : ""
            });
            if (!f.audio) audioInputs.push({ label: `nullsrc${i}`, filters: `-f lavfi -i "anullsrc=cl=stereo:sr=44100"` });
        }

        inputs.push({
            path: getAsset("image", "transparent"),
            filters: `-stream_loop -1 -t ${duration}`
        });

        let fc = "";
        let lastStream = "fov0";

        fc += `[0:v]fps=${fps},setpts=PTS-STARTPTS,\
            ${!noTransition && waitUntilEnd && files[0].shortType != "image"
            ? `tpad=stop_duration=${duration}:stop_mode=${waitMode},` : ""}\
                scale=${width}:${height}:force_original_aspect_ratio=increase,
                setsar=sar=${ratio}[fov0];`;

        let afc = "";
        audioInputs.forEach((ai, i) => {
            afc += `[${ai.label}]atrim=${!fadeAudio && !waitUntilStart && !waitUntilEnd && i > 0 ? duration / 2 : 0}:\
                ${(files[i].duration || duration) - (!fadeAudio && !waitUntilStart && !waitUntilEnd && i < files.length - 1 ? duration / 2 : 0)},asetpts=PTS-STARTPTS[a${i}];`;
        });

        const durationsArr = files.map(f => f.duration || duration);
        let cumulative = durationsArr[0];

        for (let i = 1; i < files.length ; i++) {
            const f = files[i];
            const sel = transition === "random"
                ? randomChoice(transitions)
                : transition.toLowerCase();

            let offset = cumulative - duration * i;
            if (waitUntilEnd) offset += duration * i;
            if (waitUntilStart) offset += duration * (i - 1);

            fc += `[${i}:v]fps=${fps},setpts=PTS-STARTPTS,\
                    ${!noTransition && ((waitUntilEnd && i < files.length - 1) || (waitUntilStart && i > 0)) && f.shortType != "image"
                    ? `tpad=start_duration=${waitUntilStart && i > 0 ? duration : 0}:start_mode=${waitMode}:\
                    stop_duration=${waitUntilEnd && i < files.length - 1 ? duration : 0}:stop_mode=${waitMode},` : ""}\
                    scale=${width}:${height}:force_original_aspect_ratio=increase[sv${i}];`;
            fc += `[${files.length}:v]fps=${fps},setpts=PTS-STARTPTS,scale=${width}:${height}[transparent];`;
            fc += `[transparent][sv${i}]overlay=x=(W-w)/2:y=(H-h)/2:format=auto,setsar=sar=${ratio}[fov${i}];`;

            if (!noTransition)
                fc += `[${lastStream}][fov${i}]xfade=transition=${sel}:duration=${duration}:offset=${offset}[v${i}];`;

            lastStream = `v${i}`;
            cumulative += durationsArr[i];
        }
        
        let lastAStream = "a0";

        if (noTransition) {
            const streams = inputs.slice(0, -1).map((_, i) => `[fov${i}]`).join("");
            fc += `${streams}concat=n=${files.length}:v=1:a=0[conc];`;
            lastStream = "conc";
        } else if (fadeAudio || (waitUntilEnd && waitUntilStart)) {
            for (let i = (!waitUntilEnd && !waitUntilStart ? 1 : 0); i < files.length; i++) {
                if (waitUntilEnd && waitUntilStart) {
                    if (i > 0) afc += `[a${i}]adelay=delays=${duration * 1000}:all=1[aconcat${i}];`;
                    else afc += `[a${i}]anull[aconcat${i}];`;
                    lastAStream = `aconcat${i}`;
                }

                if (waitUntilEnd && !waitUntilStart) {
                    if (i > 0) afc += `[a${i}]afade=t=in:d=${duration}[aconcat${i}];`;
                    else afc += `[a${i}]anull[aconcat${i}];`;
                    lastAStream = `aconcat${i}`;
                }

                if (!waitUntilEnd && waitUntilStart) {
                    if (i < files.length - 1) afc += `[a${i}]afade=t=out:st=${durationsArr[i] - duration}:d=${duration}[aconcat${i}];`;
                    else afc += `[a${i}]anull[aconcat${i}];`;
                    lastAStream = `aconcat${i}`;
                }

                if (!waitUntilEnd && !waitUntilStart) {
                    afc += `[${lastAStream}][a${i}]acrossfade=d=${duration}:curve1=tri:curve2=tri[axf${i}];`;
                    lastAStream = `axf${i}`;
                }
            }
        }

        if (hasAudio && (noTransition || waitUntilEnd || waitUntilStart || !fadeAudio)) {
            const aStreams = audioInputs.map(
                (_, i) => `[${(waitUntilEnd && waitUntilStart) || !((waitUntilEnd || waitUntilStart) && !fadeAudio) ? "aconcat" : "a"}${i}]`
            ).join("");
            afc += `${aStreams}concat=n=${files.length}:v=0:a=1[outa]`;
        } else afc += `[${lastAStream}]anull[outa]`;
        
        if (!hasVideo)
            fc += `[${lastStream}]split[vc][vt];` +
                `[vc]palettegen=reserve_transparent=1[pal];` +
                `[vt][pal]paletteuse=alpha_threshold=128[outv]`;
        else fc += `[${lastStream}]null[outv]`;

        const inArgs = inputs.map(f => `${f.filters ? `${f.filters} ` : ""}-i "${f.path}"`).join(" ");
        const vidCodec = hasVideo
            ? "-c:v libx264 -pix_fmt yuv420p"
            : "-gifflags -offsetting";
        const cmd = `ffmpeg -y ${inArgs} ` +
            `-filter_complex "${fc}${hasAudio ? `;${afc}` : ""}" ` +
            `-map "[outv]" ` +
            `${hasAudio ? `-map "[outa]" ` : ""}` +
            `-preset ${args.encodingPreset} ${vidCodec} "${tempOut}"`;

        await execPromise(cmd);
        return new FileEmbed(tempOut);
    }
};