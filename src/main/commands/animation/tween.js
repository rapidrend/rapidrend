const path = require("path");

const { execPromise } = require("#functions/media");
const { makeTempPath } = require("#functions/filesystem");
const { translate } = require("#functions/translate");

const { FileEmbed } = require("#modules");

module.exports = {
    name: translate("commands.tween.name"),
    description: translate("commands.tween.description"),
    category: translate("categories.animation"),
    args: {
        input: {
            name: translate("commands.tween.args.input.name"),
            desc: translate("commands.tween.args.input.desc"),
            type: "file",
            required: true,
            settings: {
                allowed: {
                    type: "mime",
                    list: ["image", "gif", "video"]
                }
            }
        },
        w: {
            name: translate("commands.tween.args.w.name"),
            desc: translate("commands.tween.args.w.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 300,
                min: 1,
                max: 1000
            }
        },
        h: {
            name: translate("commands.tween.args.h.name"),
            desc: translate("commands.tween.args.h.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 300,
                min: 1,
                max: 1000
            }
        },
        duration: {
            name: translate("commands.tween.args.duration.name"),
            desc: translate("commands.tween.args.duration.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 1,
                min: 0.05,
                max: 60
            }
        },
        startSizeX: {
            name: translate("commands.tween.args.startSizeX.name"),
            desc: translate("commands.tween.args.startSizeX.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 100,
                min: 1,
                max: 3000
            }
        },
        startSizeY: {
            name: translate("commands.tween.args.startSizeY.name"),
            desc: translate("commands.tween.args.startSizeY.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 100,
                min: 1,
                max: 3000
            }
        },
        endSizeX: {
            name: translate("commands.tween.args.endSizeX.name"),
            desc: translate("commands.tween.args.endSizeX.desc"),
            type: "number",
            required: false,
            settings: {
                dft: (args) => args.startSizeX,
                min: 1,
                max: 3000
            }
        },
        endSizeY: {
            name: translate("commands.tween.args.endSizeY.name"),
            desc: translate("commands.tween.args.endSizeY.desc"),
            type: "number",
            required: false,
            settings: {
                dft: (args) => args.startSizeY,
                min: 1,
                max: 3000
            }
        },
        originX: {
            name: translate("commands.tween.args.originX.name"),
            desc: translate("commands.tween.args.originX.desc"),
            type: "string",
            required: false,
            settings: {
                allowed: ["left", "center", "right"],
                dft: "center"
            }
        },
        originY: {
            name: translate("commands.tween.args.originY.name"),
            desc: translate("commands.tween.args.originY.desc"),
            type: "string",
            required: false,
            settings: {
                allowed: ["top", "middle", "bottom"],
                dft: "middle"
            }
        },
        startOffsetX: {
            name: translate("commands.tween.args.startOffsetX.name"),
            desc: translate("commands.tween.args.startOffsetX.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 0
            }
        },
        startOffsetY: {
            name: translate("commands.tween.args.startOffsetY.name"),
            desc: translate("commands.tween.args.startOffsetY.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 0
            }
        },
        endOffsetX: {
            name: translate("commands.tween.args.endOffsetX.name"),
            desc: translate("commands.tween.args.endOffsetX.desc"),
            type: "number",
            required: false,
            settings: {
                dft: (args) => args.startOffsetX
            }
        },
        endOffsetY: {
            name: translate("commands.tween.args.endOffsetY.name"),
            desc: translate("commands.tween.args.endOffsetY.desc"),
            type: "number",
            required: false,
            settings: {
                dft: (args) => args.startOffsetY
            }
        },
        startAngle: {
            name: translate("commands.tween.args.startAngle.name"),
            desc: translate("commands.tween.args.startAngle.desc"),
            type: "number",
            required: false,
            settings: {
                dft: 0
            }
        },
        endAngle: {
            name: translate("commands.tween.args.endAngle.name"),
            desc: translate("commands.tween.args.endAngle.desc"),
            type: "number",
            required: false,
            settings: {
                dft: (args) => args.startAngle
            }
        },
        fitAngle: {
            name: translate("commands.tween.args.fitAngle.name"),
            desc: translate("commands.tween.args.fitAngle.desc"),
            type: "boolean",
            required: false,
            settings: {
                dft: false
            }
        },
        easing: {
            name: translate("commands.tween.args.easing.name"),
            desc: translate("commands.tween.args.easing.desc"),
            type: "string",
            required: false,
            settings: {
                allowed: [
                    'linear',
                    'easeinsine',
                    'easeoutsine',
                    'easeinoutsine',
                    'easeinquad',
                    'easeoutquad',
                    'easeinoutquad',
                    'easeincubic',
                    'easeoutcubic',
                    'easeinoutcubic',
                    'easeinquart',
                    'easeoutquart',
                    'easeinoutquart',
                    'easeinquint',
                    'easeoutquint',
                    'easeinoutquint',
                    'easeinexpo',
                    'easeoutexpo',
                    'easeinoutexpo',
                    'easeincirc',
                    'easeoutcirc',
                    'easeinoutcirc',
                    'easeinback',
                    'easeoutback',
                    'easeinoutback',
                    'easeinelastic',
                    'easeoutelastic',
                    'easeinoutelastic',
                    'easeinbounce',
                    'easeoutbounce',
                    'easeinoutbounce'
                ],
                dft: 'linear'
            }
        }
    },
    globalArgs: ["encodingPreset"],
    execute: async function (args) {
        const file = args.input;
        const {
            w: width, h: height, duration,
            startSizeX, startSizeY, endSizeX, endSizeY,
            originX, originY,
            startOffsetX, startOffsetY, endOffsetX, endOffsetY,
            startAngle, endAngle, fitAngle, easing
        } = args;

        const { path: filePath } = file;

        const easings = {
            linear: `'lerp({start},{end},(t/${duration}))'`,
            easeinsine: `'lerp({start},{end},1-cos((t/${duration})*PI/2))'`,
            easeoutsine: `'lerp({start},{end},sin(((t/${duration})*PI)/2))'`,
            easeinoutsine: `'lerp({start},{end},-(cos(PI*(t/${duration}))-1)/2)'`,
            easeinquad: `'lerp({start},{end},(t/${duration})*(t/${duration}))'`,
            easeoutquad: `'lerp({start},{end},1-(1-(t/${duration}))*(1-(t/${duration})))'`,
            easeinoutquad: `'lerp({start},{end},if(lt((t/${duration}),0.5),2*(t/${duration})*(t/${duration}),1-pow(-2*(t/${duration})+2,2)/2))'`,
            easeincubic: `'lerp({start},{end},(t/${duration})*(t/${duration})*(t/${duration}))'`,
            easeoutcubic: `'lerp({start},{end},1-pow(1-(t/${duration}),3))'`,
            easeinoutcubic: `'lerp({start},{end},if(lt((t/${duration}),0.5),4*(t/${duration})*(t/${duration})*(t/${duration}),1-pow(-2*(t/${duration})+2,3)/2))'`,
            easeinquart: `'lerp({start},{end},(t/${duration})*(t/${duration})*(t/${duration})*(t/${duration}))'`,
            easeoutquart: `'lerp({start},{end},1-pow(1-(t/${duration}),4))'`,
            easeinoutquart: `'lerp({start},{end},if(lt((t/${duration}),0.5),8*(t/${duration})*(t/${duration})*(t/${duration})*(t/${duration}),1-pow(-2*(t/${duration})+2,4)/2))'`,
            easeinquint: `'lerp({start},{end},(t/${duration})*(t/${duration})*(t/${duration})*(t/${duration})*(t/${duration}))'`,
            easeoutquint: `'lerp({start},{end},1-pow(1-(t/${duration}),5))'`,
            easeinoutquint: `'lerp({start},{end},if(lt((t/${duration}),0.5),16*(t/${duration})*(t/${duration})*(t/${duration})*(t/${duration})*(t/${duration}),1-pow(-2*(t/${duration})+2,5)/2))'`,
            easeinexpo: `'lerp({start},{end},if(eq((t/${duration}),0),0,pow(2,10*(t/${duration})-10)))'`,
            easeoutexpo: `'lerp({start},{end},if(eq((t/${duration}),1),1,1-pow(2,-10*(t/${duration}))))'`,
            easeinoutexpo: `'lerp({start},{end},if(eq((t/${duration}),0),0,if(eq((t/${duration}),1),1,if(lt((t/${duration}),0.5,pow(2,20*(t/${duration})-10)/2,(2-pow(2,-20*(t/${duration})+10))/2)))))'`,
            easeincirc: `'lerp({start},{end},1-sqrt(1-pow((t/${duration}),2)))'`,
            easeoutcirc: `'lerp({start},{end},sqrt(1-pow((t/${duration})-1,2)))'`,
            easeinoutcirc: `'lerp({start},{end},if(lt((t/${duration}),0.5),(1-sqrt(1-pow(2*(t/${duration}),2)))/2,(sqrt(1-pow(-2*(t/${duration})+2,2))+1)/2))'`,
            easeinback: `'lerp({start},{end},2.70158*(t/${duration})*(t/${duration})*(t/${duration})-1.70158*(t/${duration})*(t/${duration}))'`,
            easeoutback: `'lerp({start},{end},1+2.70158*pow((t/${duration})-1,3)+1.70158*pow((t/${duration})-1,2))'`,
            easeinoutback: `'lerp({start},{end},if(lt((t/${duration}),0.5),(pow(2*(t/${duration}),2)*((2.5949095+1)*2*(t/${duration})-2.5949095))/2,(pow(2*(t/${duration})-2,2)*((2.5949095+1)*((t/${duration})*2-2)+2.5949095)+2)/2))'`,
            easeinelastic: `'lerp({start},{end},if(eq((t/${duration}),0),0,if(eq((t/${duration}),1),1,-pow(2,10*(t/${duration})-10)*sin(((t/${duration})*10-10.75)*((2*PI)/3)))))'`,
            easeoutelastic: `'lerp({start},{end},if(eq((t/${duration}),0),0,if(eq((t/${duration}),1),1,pow(2,-10*(t/${duration}))*sin(((t/${duration})*10-0.75)*((2*PI)/3))+1)))'`,
            easeinoutelastic: `'lerp({start},{end},if(eq((t/${duration}),0),0,if(eq((t/${duration}),1),1,if(lt((t/${duration}),0.5),-(pow(2,20*(t/${duration})-10)*sin((20*(t/${duration})-11.125)*((2*PI)/4.5)))/2,(pow(2,-20*(t/${duration})+10)*sin((20*(t/${duration})-11.125)*((2*PI)/4.5)))/2+1))))'`,
            easeinbounce: `'lerp({start},{end},1-(if(lt((1-(t/${duration})),1/2.75),7.5625*(1-(t/${duration}))*(1-(t/${duration})),if(lt((1-(t/${duration})),2/2.75),7.5625*((1-(t/${duration}))-1.5/2.75)*((1-(t/${duration}))-1.5/2.75)+0.75,if(lt((1-(t/${duration})),2.5/2.75),7.5625*((1-(t/${duration}))-2.25/2.75)*((1-(t/${duration}))-2.25/2.75)+0.9375,7.5625*((1-(t/${duration}))-2.625/2.75)*((1-(t/${duration}))-2.625/2.75)+0.984375)))))'`,
            easeoutbounce: `'lerp({start},{end},if(lt((t/${duration}),1/2.75),7.5625*(t/${duration})*(t/${duration}),if(lt((t/${duration}),2/2.75),7.5625*((t/${duration})-1.5/2.75)*((t/${duration})-1.5/2.75)+0.75,if(lt((t/${duration}),2.5/2.75),7.5625*((t/${duration})-2.25/2.75)*((t/${duration})-2.25/2.75)+0.9375,7.5625*((t/${duration})-2.625/2.75)*((t/${duration})-2.625/2.75)+0.984375))))'`,
            easeinoutbounce: `'lerp({start},{end},if(lt((t/${duration}),0.5),(1-if(lt((1-2*(t/${duration})),1/2.75),7.5625*(1-2*(t/${duration}))*(1-2*(t/${duration})),if(lt((1-2*(t/${duration})),2/2.75),7.5625*((1-2*(t/${duration}))-1.5/2.75)*((1-2*(t/${duration}))-1.5/2.75)+0.75,if(lt((1-2*(t/${duration})),2.5/2.75),7.5625*((1-2*(t/${duration}))-2.25/2.75)*((1-2*(t/${duration}))-2.25/2.75)+0.9375,7.5625*((1-2*(t/${duration}))-2.625/2.75)*((1-2*(t/${duration}))-2.625/2.75)+0.984375))))/2,(1+if(lt((2*(t/${duration})-1),1/2.75),7.5625*(2*(t/${duration})-1)*(2*(t/${duration})-1),if(lt((2*(t/${duration})-1),2/2.75),7.5625*((2*(t/${duration})-1)-1.5/2.75)*((2*(t/${duration})-1)-1.5/2.75)+0.75,if(lt((2*(t/${duration})-1),2.5/2.75),7.5625*((2*(t/${duration})-1)-2.25/2.75)*((2*(t/${duration})-1)-2.25/2.75)+0.9375,7.5625*((2*(t/${duration})-1)-2.625/2.75)*((2*(t/${duration})-1)-2.625/2.75)+0.984375))))/2))'`,
        };

        const easingString = (start, end) => {
            return easings[easing].replace('{start}', start).replace('{end}', end);
        };

        const origins = {
            x: {
                left: '0',
                center: '(W-w)/2',
                right: '(W-w)'
            },
            y: {
                top: '0',
                middle: '(H-h)/2',
                bottom: '(H-h)'
            }
        };

        const originXExpr = origins.x[originX] || '(W-w)/2';
        const originYExpr = origins.y[originY] || '(H-h)/2';

        let tempPath = makeTempPath("gif");

        await execPromise(`ffmpeg -stream_loop -1 -t ${duration} -i "${filePath}" \
            -r 50 -stream_loop -1 -t ${duration} -i ${path.join(appPath, "assets", "image", "transparent.png")} \
            -filter_complex "[0:v]fps=50,rotate=${easingString(startAngle, endAngle)}*PI/180${fitAngle ? `:ow=rotw(45*PI/180):oh=roth(45*PI/180)` : ''}:c=0x00000000,\
            scale=${easingString(startSizeX, endSizeX)}:${easingString(startSizeY, endSizeY)}:eval=frame[overlay];\
            [1:v]scale=${width}:${height}[transparent];[transparent][overlay]overlay=x=${originXExpr}+${easingString(startOffsetX, endOffsetX)}:y=${originYExpr}+${easingString(startOffsetY, endOffsetY)}:format=auto,split[pout][ppout];\
            [ppout]palettegen=reserve_transparent=1[palette];[pout][palette]paletteuse=alpha_threshold=128[out]" \
            -map "[out]" -preset ${args.encodingPreset} -gifflags -offsetting -r 50 -t ${duration} -y "${tempPath}"`);

        return new FileEmbed(tempPath);
    }
};