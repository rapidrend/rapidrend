const { QApplication, ColorGroup, ColorRole } = require("@nodegui/nodegui");
const Registry = require("winreg");

const path = require("path");
const os = require("os");
const { promisify } = require("util");

const getAssetPath = (filename, isDark) =>
    path.join(__appPath, "assets", "gui", isDark ? "dark" : "light", filename);

const createTheme = (isDark) => {
    const baseColors = {
        primary: "#b632ff",
        text: isDark ? "#d8cce6" : "#4b3b5c",
        secondaryText: isDark ? "#ba98c8" : "#6a5482",
        background: isDark ? "#18081c" : "#f6f0fb",
        secondaryBg: isDark ? "#1f0d28" : "#f7eeff",
        selected: isDark ? "#4d2a6d" : "#d3aaff",
        danger: {
            main: isDark ? "#a0285f" : "#ff4f88",
            border: isDark ? "#d63479" : "#bb2255",
            hover: isDark ? "#e24b91" : "#ff7aa8",
            pressed: isDark ? "#bb0055" : "#ff99bb"
        }
    };

    return {
        isDark,
        colors: {
            ...baseColors,
            button: {
                bg: isDark ? "#311941" : "#f0ddff",
                hover: isDark ? "#3a1a4f" : "#e5d1f9",
                pressed: isDark ? "#23122f" : "#e8c8ff",
                border: isDark ? "#4d2a6d" : "#d3aaff",
                text: baseColors.text,
            },
            input: {
                bg: isDark ? "#24122f" : "#f4e6ff",
                hover: isDark ? "#30203d" : "#f3e4ff",
                border: isDark ? "#4d2a6d" : "#d3aaff",
                placeholder: isDark ? "#9977bb" : "#9e88b0",
            },
            group: {
                bg: isDark ? "#24122f" : "#f4e6ff",
                border: isDark ? "#311841" : "#e5d1f9",
            },
            checkbox: {
                border: isDark ? "#775599" : "#ccbbe6",
                hover: "#b632ff",
                bg: isDark ? "#271b33" : "#ffffff",
                checked: baseColors.primary,
                disabledBg: isDark ? "#444055" : "#dcd2e8",
                disabledBorder: isDark ? "#6e5c8c" : "#bba7d6",
            },
            scrollbar: {
                handle: isDark ? "#5a337a" : "#e0c0ff",
                hover: "#cc66ff",
            },
            taskGroups: {
                running: {
                    main: isDark ? "#24122f" : "#f4e6ff",
                    border: isDark ? "#311841" : "#e5d1f9",
                },
                completed: {
                    main: isDark ? "#122f16" : "#ebffe6",
                    border: isDark ? "#18411e" : "#dbf9d1"
                },
                failed: {
                    main: isDark ? "#2f2912" : "#f9ffe6",
                    border: isDark ? "#413818" : "#f2f9d1"
                },
                cancelling: {
                    main: isDark ? "#2f1312" : "#ffe6e7",
                    border: isDark ? "#411918" : "#f9d1d5"
                },
                cancelled: {
                    main: isDark ? "#2f1312" : "#ffe6e7",
                    border: isDark ? "#411918" : "#f9d1d5"
                },
                killed: {
                    main: isDark ? "#930000" : "#ffacac",
                    border: isDark ? "#c90000" : "#ff5067"
                }
            },
            tweens: {
                linear: {
                    bg: "#929292",
                    border: "#606060",
                },
                constant: {
                    bg: "#9d50d4",
                    border: "#713a99",
                },
                sine: {
                    bg: "#2bd31f",
                    border: "#1e9215",
                },
                quad: {
                    bg: "#e41919",
                    border: "#9a1111",
                },
                cubic: {
                    bg: "#ddb439",
                    border: "#957927",
                },
                quart: {
                    bg: "#d68809",
                    border: "#996107",
                },
                quint: {
                    bg: "#e95aab",
                    border: "#9d3c73",
                },
                expo: {
                    bg: "#b62af2",
                    border: "#621682",
                },
                circ: {
                    bg: "#d40071",
                    border: "#9a0052",
                },
                back: {
                    bg: "#c3aee1",
                    border: "#7f7192",
                },
                elastic: {
                    bg: "#72a439",
                    border: "#4a6b25",
                },
                bounce: {
                    bg: "#99e4cf",
                    border: "#649587",
                }
            }
        },
        assets: {
            leftArrow: getAssetPath("left.svg", isDark),
            rightArrow: getAssetPath("right.svg", isDark),
            downArrow: getAssetPath("down.svg", isDark),
            upArrow: getAssetPath("up.svg", isDark),
            starIcon: getAssetPath("star.svg", isDark),
            starFilledIcon: path.join(__appPath, "assets", "gui", "star-filled.svg"),
            sidebarIcon: getAssetPath("sidebar.svg", isDark),
            sidebarFilledIcon: getAssetPath("sidebar-filled.svg", isDark),
            tasklistIcon: getAssetPath("tasklist.svg", isDark),
            tasklistFilledIcon: getAssetPath("tasklist-filled.svg", isDark),
            closeIcon: getAssetPath("close.svg", isDark),
            menuIcon: getAssetPath("menu.svg", isDark),
            videoIcon: getAssetPath("video.svg", isDark),
            audioIcon: getAssetPath("audio.svg", isDark),
            videoSpin: getAssetPath("video-spin.gif", isDark),
            checkmark: path.join(__appPath, "assets", "gui", "checkmark.svg"),
            transparentBackground: getAssetPath("transparent.png", isDark),
            statuses: {
                error: path.join(__appPath, "assets", "gui", "warn.svg"),
                success: path.join(__appPath, "assets", "gui", "success.svg")
            }
        },
        sizes: {
            borderRadius: "10px",
            smallBorderRadius: "5px",
            padding: "5px",
            largePadding: "10px",
        },
        fonts: {
            title: {
                size: "20px",
                weight: "600",
            },
            groupLabel: {
                size: "15px",
                weight: "600",
            },
            small: {
                size: "12px",
            }
        }
    };
};

module.exports = {
    light: createTheme(false),
    dark: createTheme(true),
    createTheme,
    detectTheme: async () => {
        if (app.vars.theme == "light") return false;
        if (app.vars.theme == "dark") return true;

        if (os.platform() == "win32") {
            const regKey = new Registry({
                hive: Registry.HKCU,
                key: "\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize"
            });

            const getKey = promisify(regKey.get);
            const item = await getKey.call(regKey, "AppsUseLightTheme");

            return parseInt(item.value) === 0;
        }

        const appPalette = QApplication.instance().palette();
        const windowTextColor = appPalette.color(ColorGroup.Active, ColorRole.WindowText);
        return windowTextColor.red() > 128 &&
            windowTextColor.green() > 128 &&
            windowTextColor.blue() > 128;
    }
};