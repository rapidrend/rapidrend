const { execPromise, scaledDimensions } = require("#functions/media");
const { makeTempPath, getAsset } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const FileEmbed = require("#classes/FileEmbed");

const easingFunctions = {
    linear: {
        in: `lerp({start},{end},(({t}-{startTime})/{duration}))`,
        out: `lerp({start},{end},(({t}-{startTime})/{duration}))`,
        inOut: `lerp({start},{end},(({t}-{startTime})/{duration}))`
    },
    constant: {
        in: `{start}`,
        out: `{start}`,
        inOut: `{start}`
    },
    sine: {
        in: `lerp({start},{end},1-cos((({t}-{startTime})/{duration})*PI/2))`,
        out: `lerp({start},{end},sin(((({t}-{startTime})/{duration})*PI)/2))`,
        inOut: `lerp({start},{end},-(cos(PI*(({t}-{startTime})/{duration}))-1)/2)`
    },
    quad: {
        in: `lerp({start},{end},(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration}))`,
        out: `lerp({start},{end},1-(1-(({t}-{startTime})/{duration}))*(1-(({t}-{startTime})/{duration})))`,
        inOut: `lerp({start},{end},if(lt((({t}-{startTime})/{duration}),0.5),2*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration}),1-pow(-2*(({t}-{startTime})/{duration})+2,2)/2))`
    },
    cubic: {
        in: `lerp({start},{end},(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration}))`,
        out: `lerp({start},{end},1-pow(1-(({t}-{startTime})/{duration}),3))`,
        inOut: `lerp({start},{end},if(lt((({t}-{startTime})/{duration}),0.5),4*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration}),1-pow(-2*(({t}-{startTime})/{duration})+2,3)/2))`
    },
    quart: {
        in: `lerp({start},{end},(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration}))`,
        out: `lerp({start},{end},1-pow(1-(({t}-{startTime})/{duration}),4))`,
        inOut: `lerp({start},{end},if(lt((({t}-{startTime})/{duration}),0.5),8*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration}),1-pow(-2*(({t}-{startTime})/{duration})+2,4)/2))`
    },
    quint: {
        in: `lerp({start},{end},(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration}))`,
        out: `lerp({start},{end},1-pow(1-(({t}-{startTime})/{duration}),5))`,
        inOut: `lerp({start},{end},if(lt((({t}-{startTime})/{duration}),0.5),16*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration}),1-pow(-2*(({t}-{startTime})/{duration})+2,5)/2))`
    },
    expo: {
        in: `lerp({start},{end},if(eq((({t}-{startTime})/{duration}),0),0,pow(2,10*(({t}-{startTime})/{duration})-10)))`,
        out: `lerp({start},{end},if(eq((({t}-{startTime})/{duration}),1),1,1-pow(2,-10*(({t}-{startTime})/{duration}))))`,
        inOut: `lerp({start},{end},if(eq((({t}-{startTime})/{duration}),0),0,if(eq((({t}-{startTime})/{duration}),1),1,if(lt((({t}-{startTime})/{duration}),0.5,pow(2,20*(({t}-{startTime})/{duration})-10)/2,(2-pow(2,-20*(({t}-{startTime})/{duration})+10))/2)))))`
    },
    circ: {
        in: `lerp({start},{end},1-sqrt(1-pow((({t}-{startTime})/{duration}),2)))`,
        out: `lerp({start},{end},sqrt(1-pow((({t}-{startTime})/{duration})-1,2)))`,
        inOut: `lerp({start},{end},if(lt((({t}-{startTime})/{duration}),0.5),(1-sqrt(1-pow(2*(({t}-{startTime})/{duration}),2)))/2,(sqrt(1-pow(-2*(({t}-{startTime})/{duration})+2,2))+1)/2))`
    },
    back: {
        in: `lerp({start},{end},2.70158*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration})-1.70158*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration}))`,
        out: `lerp({start},{end},1+2.70158*pow((({t}-{startTime})/{duration})-1,3)+1.70158*pow((({t}-{startTime})/{duration})-1,2))`,
        inOut: `lerp({start},{end},if(lt((({t}-{startTime})/{duration}),0.5),(pow(2*(({t}-{startTime})/{duration}),2)*((2.5949095+1)*2*(({t}-{startTime})/{duration})-2.5949095))/2,(pow(2*(({t}-{startTime})/{duration})-2,2)*((2.5949095+1)*((({t}-{startTime})/{duration})*2-2)+2.5949095)+2)/2))`
    },
    elastic: {
        in: `lerp({start},{end},if(eq((({t}-{startTime})/{duration}),0),0,if(eq((({t}-{startTime})/{duration}),1),1,-pow(2,10*(({t}-{startTime})/{duration})-10)*sin(((({t}-{startTime})/{duration})*10-10.75)*((2*PI)/3)))))`,
        out: `lerp({start},{end},if(eq((({t}-{startTime})/{duration}),0),0,if(eq((({t}-{startTime})/{duration}),1),1,pow(2,-10*(({t}-{startTime})/{duration}))*sin(((({t}-{startTime})/{duration})*10-0.75)*((2*PI)/3))+1)))`,
        inOut: `lerp({start},{end},if(eq((({t}-{startTime})/{duration}),0),0,if(eq((({t}-{startTime})/{duration}),1),1,if(lt((({t}-{startTime})/{duration}),0.5),-(pow(2,20*(({t}-{startTime})/{duration})-10)*sin((20*(({t}-{startTime})/{duration})-11.125)*((2*PI)/4.5)))/2,(pow(2,-20*(({t}-{startTime})/{duration})+10)*sin((20*(({t}-{startTime})/{duration})-11.125)*((2*PI)/4.5)))/2+1))))`
    },
    bounce: {
        in: `lerp({start},{end},1-(if(lt((1-(({t}-{startTime})/{duration})),1/2.75),7.5625*(1-(({t}-{startTime})/{duration}))*(1-(({t}-{startTime})/{duration})),if(lt((1-(({t}-{startTime})/{duration})),2/2.75),7.5625*((1-(({t}-{startTime})/{duration}))-1.5/2.75)*((1-(({t}-{startTime})/{duration}))-1.5/2.75)+0.75,if(lt((1-(({t}-{startTime})/{duration})),2.5/2.75),7.5625*((1-(({t}-{startTime})/{duration}))-2.25/2.75)*((1-(({t}-{startTime})/{duration}))-2.25/2.75)+0.9375,7.5625*((1-(({t}-{startTime})/{duration}))-2.625/2.75)*((1-(({t}-{startTime})/{duration}))-2.625/2.75)+0.984375)))))`,
        out: `lerp({start},{end},if(lt((({t}-{startTime})/{duration}),1/2.75),7.5625*(({t}-{startTime})/{duration})*(({t}-{startTime})/{duration}),if(lt((({t}-{startTime})/{duration}),2/2.75),7.5625*((({t}-{startTime})/{duration})-1.5/2.75)*((({t}-{startTime})/{duration})-1.5/2.75)+0.75,if(lt((({t}-{startTime})/{duration}),2.5/2.75),7.5625*((({t}-{startTime})/{duration})-2.25/2.75)*((({t}-{startTime})/{duration})-2.25/2.75)+0.9375,7.5625*((({t}-{startTime})/{duration})-2.625/2.75)*((({t}-{startTime})/{duration})-2.625/2.75)+0.984375))))`,
        inOut: `lerp({start},{end},if(lt((({t}-{startTime})/{duration}),0.5),(1-if(lt((1-2*(({t}-{startTime})/{duration})),1/2.75),7.5625*(1-2*(({t}-{startTime})/{duration}))*(1-2*(({t}-{startTime})/{duration})),if(lt((1-2*(({t}-{startTime})/{duration})),2/2.75),7.5625*((1-2*(({t}-{startTime})/{duration}))-1.5/2.75)*((1-2*(({t}-{startTime})/{duration}))-1.5/2.75)+0.75,if(lt((1-2*(({t}-{startTime})/{duration})),2.5/2.75),7.5625*((1-2*(({t}-{startTime})/{duration}))-2.25/2.75)*((1-2*(({t}-{startTime})/{duration}))-2.25/2.75)+0.9375,7.5625*((1-2*(({t}-{startTime})/{duration}))-2.625/2.75)*((1-2*(({t}-{startTime})/{duration}))-2.625/2.75)+0.984375))))/2,(1+if(lt((2*(({t}-{startTime})/{duration})-1),1/2.75),7.5625*(2*(({t}-{startTime})/{duration})-1)*(2*(({t}-{startTime})/{duration})-1),if(lt((2*(({t}-{startTime})/{duration})-1),2/2.75),7.5625*((2*(({t}-{startTime})/{duration})-1)-1.5/2.75)*((2*(({t}-{startTime})/{duration})-1)-1.5/2.75)+0.75,if(lt((2*(({t}-{startTime})/{duration})-1),2.5/2.75),7.5625*((2*(({t}-{startTime})/{duration})-1)-2.25/2.75)*((2*(({t}-{startTime})/{duration})-1)-2.25/2.75)+0.9375,7.5625*((2*(({t}-{startTime})/{duration})-1)-2.625/2.75)*((2*(({t}-{startTime})/{duration})-1)-2.625/2.75)+0.984375))))/2))`
    }
};

module.exports = {
    name: translate("commands.tween.name"),
    description: translate("commands.tween.description"),
    category: translate("categories.animation"),
    args: require("#args/commands/animation/tween"),
    globalArgs: ["encodingPreset"],
    editors: ["tween"],
    execute: async function (args) {
        const files = args.files;
        const {
            width, height, duration, stretchAngle
        } = args;

        const tempPath = makeTempPath("gif");

        const overlayFilters = [];
        const inputStreams = [];

        let overlayChain = "[transparent]";

        files.forEach((file, index) => {
            const { path: filePath, type: { ext } } = file;

            inputStreams.push(`-stream_loop -1 -t ${duration} ${ext === "jpg" ? "-f image2 " : ""}-i "${filePath}"`);

            const keyframes = args.keyframes
                .filter(kp => kp.f == index)
                .map(kp => ({ ...kp }))
                .sort((a, b) => a.t - b.t);

            const createFirstKeyframe = (prop, track) => {
                const keyframe = {};

                const scaledSize = scaledDimensions(file, { width: width / 3, height: height / 3 });

                let firstKp = track[0] ?? {};
                let defaultKp = {
                    x: 0,
                    y: 0,
                    w: scaledSize.width,
                    h: scaledSize.height,
                    r: 0,
                    o: 1
                };

                keyframe.t = 0;
                keyframe.e = keyframe.e ?? firstKp.e ?? "sine";
                keyframe.d = keyframe.d ?? firstKp.d ?? "inOut";

                keyframe.value = keyframe.value ?? firstKp.value ?? defaultKp[prop];

                return keyframe;
            }

            const properties = ["x", "y", "w", "h", "r", "o"];
            const tracks = properties.reduce((acc, prop) => {
                acc[prop] = [];

                for (const kp of keyframes) {
                    if (kp[prop] != undefined) {
                        acc[prop].push({
                            t: kp.t,
                            value: kp[prop],
                            e: kp.e || "sine",
                            d: kp.d || "inOut"
                        });
                    }
                }

                return acc;
            }, {});

            const easingString = (startVal, endVal, startTime, endTime, easingStyle, easingDirection, isUpper) => {
                const duration = endTime - startTime || 1;
                const easingFn = easingFunctions[easingStyle][easingDirection]
                    .replace(/\{start}/g, startVal)
                    .replace(/\{end}/g, endVal)
                    .replace(/\{startTime}/g, startTime)
                    .replace(/\{duration}/g, duration)
                    .replace(/\{t}/g, isUpper ? "T" : "t");

                return easingFn;
            };

            const buildExpression = (track, prop, isUpper) => {
                let expr = "";

                if (track[0]?.t !== 0) {
                    const firstKeyframe = createFirstKeyframe(prop, track);
                    track.unshift(firstKeyframe);
                }

                for (let i = 0; i < track.length - 1; i++) {
                    const current = track[i];
                    const next = track[i + 1] ?? current;
                    const lerp = easingString(
                        current.value.toFixed(3),
                        next.value.toFixed(3),
                        current.t.toFixed(3),
                        next.t.toFixed(3),
                        current.e,
                        current.d,
                        isUpper
                    );
                    expr += `if(lte(${isUpper ? "T" : "t"},${next.t.toFixed(3)}),${lerp},`;
                }

                expr += track[track.length - 1].value;
                expr += ")".repeat(track.length - 1);
                return expr;
            };

            const xExpr = buildExpression(tracks.x, "x");
            const yExpr = buildExpression(tracks.y, "y");
            const wExpr = buildExpression(tracks.w, "w");
            const hExpr = buildExpression(tracks.h, "h");
            const rExpr = buildExpression(tracks.r, "r");
            const oExpr = buildExpression(tracks.o, "o", true);

            const maxScaledX = Math.max(...tracks.w.map(k => k.value));
            const maxScaledY = Math.max(...tracks.h.map(k => k.value));
            const maxSizeVal = Math.hypot(maxScaledX, maxScaledY);

            let transformationFilters = stretchAngle
                ? `rotate='${rExpr}*PI/180':ow=hypot(iw,ih):oh=ow:c=0x00000000,\
                scale='${wExpr}':'${hExpr}':eval=frame`
                : `scale='${wExpr}':'${hExpr}':eval=frame,\
                rotate='${rExpr}*PI/180':ow=${maxSizeVal}:oh=${maxSizeVal}:c=0x00000000`;

            transformationFilters += `,geq=r='r(X,Y)':a='${oExpr}*alpha(X,Y)'`;

            const correctedOriginX = `'((W-w)/2)+(${xExpr})'`;
            const correctedOriginY = `'((H-h)/2)+(${yExpr})'`;

            overlayFilters.push(`[${index}:v]fps=50,${transformationFilters}[overlay${index}]`);

            overlayChain += `[overlay${index}]overlay=x=${correctedOriginX}:y=${correctedOriginY}:format=auto`;
            if (index < files.length - 1) {
                overlayChain += "[bg" + index + "];[bg" + index + "]";
            }
        });

        const inputStreamsStr = inputStreams.join(" ");

        let filterComplex = overlayFilters.join(";") + `;[${files.length}:v]scale=${width}:${height}[transparent]`;
        filterComplex += `;${overlayChain},split[pout][ppout];[ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]`;

        await execPromise(`ffmpeg ${inputStreamsStr} \
            -r 50 -stream_loop -1 -t ${duration} -i "${getAsset("image", "transparent")}" \
            -filter_complex "${filterComplex}" \
            -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting -r 50 -t ${duration} "${tempPath}"`);

        return new FileEmbed(tempPath);
    }
};