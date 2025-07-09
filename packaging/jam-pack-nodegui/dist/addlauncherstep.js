"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _AddLauncherStep_config, _AddLauncherStep_launcherName;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLauncherStep = void 0;
/*
 * Copyright 2022 Simon Edwards <simon@simonzone.com>
 *
 * This source code is licensed under the MIT license which is detailed in the LICENSE.txt file.
 */
const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const utils_js_1 = require("./utils.js");
const patchwindowsexe_js_1 = require("./patchwindowsexe.js");
const rcedit = require('rcedit');
const sourcedir_js_1 = require("./sourcedir.js");
class AddLauncherStep {
    constructor(config) {
        _AddLauncherStep_config.set(this, null);
        _AddLauncherStep_launcherName.set(this, null);
        __classPrivateFieldSet(this, _AddLauncherStep_config, config, "f");
    }
    isSkip() {
        return __classPrivateFieldGet(this, _AddLauncherStep_config, "f").skip == true;
    }
    async preflightCheck(logger) {
        if (__classPrivateFieldGet(this, _AddLauncherStep_config, "f").skip) {
            logger.subsection("Add Launcher step (skipping)");
            return true;
        }
        logger.subsection("Add Launcher step");
        logger.checkOk("Using default application name as launcher executable name.");
        if (__classPrivateFieldGet(this, _AddLauncherStep_config, "f").jsEntryPoint == null) {
            logger.checkError(`No 'jsEntryPoint' field was found in the configuration file, 'addLauncher' section.`);
            return false;
        }
        logger.checkOk(`Using '${__classPrivateFieldGet(this, _AddLauncherStep_config, "f").jsEntryPoint}' as the JavaScript entry point.`);
        return true;
    }
    async execute(logger, fetchStep, buildStep, pruneStep) {
        if (__classPrivateFieldGet(this, _AddLauncherStep_config, "f").skip) {
            logger.subsection("Add Launcher step (skipping)");
            return true;
        }
        logger.subsection("Add Launcher step");
        const jsEntryPoint = __classPrivateFieldGet(this, _AddLauncherStep_config, "f").jsEntryPoint;
        if (!shell.test("-f", path.join(fetchStep.getSourcePath(), jsEntryPoint))) {
            logger.error(`JavaScript entry point file '${jsEntryPoint}' can't be found.`);
            return false;
        }
        const platform = (0, utils_js_1.getPlatform)();
        const extension = platform === "windows" ? ".exe" : "";
        __classPrivateFieldSet(this, _AddLauncherStep_launcherName, buildStep.getApplicationName() + extension, "f");
        const destPath = path.join(fetchStep.getSourcePath(), __classPrivateFieldGet(this, _AddLauncherStep_launcherName, "f"));
        if (shell.test("-e", destPath)) {
            logger.error(`Unable to copy in the launcher executable to '${destPath}', a file with the same name already exists.`);
            return false;
        }
        const launcherName = {
            "linux": "linux_launcher",
            "macos": "macos_launcher",
            "windows": "windows_launcher.exe",
        }[platform];
        const launcherExe = fs.readFileSync(path.join(sourcedir_js_1.path, "../resources/launcher/", launcherName));
        //patchBinary(launcherExe, "4f8177788c5a4086ac9f18d8639b7717", jsEntryPoint);
        if (platform === "windows") {
            const dllDirs = new Set();
            shell.cd(fetchStep.getSourcePath());
            for (const dll of shell.ls("**/*.dll")) {
                dllDirs.add(path.dirname(dll));
            }
            const dllPaths = Array.from(dllDirs).join(";") + ";\0";
            //patchBinary(launcherExe, "92c9c49a891d4061ba239c46fcf4c840", dllPaths);
        }
        fs.writeFileSync(destPath, launcherExe);
        if (platform === "windows") {
            //(0, patchwindowsexe_js_1.switchToGuiSubsystem)(destPath);
            let iconPath = path.join(pruneStep.getTrashDirectory(), 'packaging', __classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsIcon) ?? path.join(sourcedir_js_1.path, "../resources/icons/small_logo.ico");
            const options = {
                icon: iconPath
            };
            const versionOptions = {};
            if (__classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsVersionString != null) {
                options["product-version"] = __classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsVersionString;
            }
            if (__classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsFileVersion != null) {
                options["file-version"] = __classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsFileVersion;
            }
            if (__classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsComments != null) {
                versionOptions.Comments = __classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsComments;
                options["version-string"] = versionOptions;
            }
            if (__classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsCompanyName != null) {
                versionOptions.CompanyName = __classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsCompanyName;
                options["version-string"] = versionOptions;
            }
            if (__classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsFileDescription != null) {
                versionOptions.FileDescription = __classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsFileDescription;
                options["version-string"] = versionOptions;
            }
            if (__classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsInternalFilename != null) {
                versionOptions.InternalFilename = __classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsInternalFilename;
                options["version-string"] = versionOptions;
            }
            if (__classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsLegalCopyright != null) {
                versionOptions.LegalCopyright = __classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsLegalCopyright;
                options["version-string"] = versionOptions;
            }
            if (__classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsLegalTrademarks1 != null) {
                versionOptions.LegalTrademarks1 = __classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsLegalTrademarks1;
                options["version-string"] = versionOptions;
            }
            if (__classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsLegalTrademarks2 != null) {
                versionOptions.LegalTrademarks2 = __classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsLegalTrademarks2;
                options["version-string"] = versionOptions;
            }
            if (__classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsOriginalFilename != null) {
                versionOptions.OriginalFilename = __classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsOriginalFilename;
                options["version-string"] = versionOptions;
            }
            if (__classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsProductName != null) {
                versionOptions.ProductName = __classPrivateFieldGet(this, _AddLauncherStep_config, "f").windowsProductName;
                options["version-string"] = versionOptions;
            }
            await rcedit(destPath, options);
        }
        if (platform === "linux" || platform === "macos") {
            shell.chmod("a+x", destPath);
        }
        logger.info(`Wrote launcher executable '${__classPrivateFieldGet(this, _AddLauncherStep_launcherName, "f")}'`);
        return true;
    }
    getLauncherName() {
        return __classPrivateFieldGet(this, _AddLauncherStep_launcherName, "f");
    }
}
exports.AddLauncherStep = AddLauncherStep;
_AddLauncherStep_config = new WeakMap(), _AddLauncherStep_launcherName = new WeakMap();
function patchBinary(binary, magic, value) {
    const entryPointByteOffset = binary.indexOf(magic);
    for (let i = 0; i < value.length; i++) {
        binary[entryPointByteOffset + i] = value.codePointAt(i);
    }
    binary[entryPointByteOffset + value.length] = 0;
}
//# sourceMappingURL=addlauncherstep.js.map