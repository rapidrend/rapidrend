let modules = {};

const fs = require("fs-extra");
const path = require("path");

modules.FileEmbed = class FileEmbed {
    constructor(path) {
        if (!fs.existsSync(path)) throw `The file does not exist: ${path}`;

        this.tempPath = path;
        this.currentPath = path;
    }

    move(path) {
        if (this.currentPath == this.tempPath) fs.moveSync(this.currentPath, path, { overwrite: true });
        else fs.copyFileSync(this.currentPath, path, fs.constants.COPYFILE_FICLONE);
        
        this.currentPath = path;
    }

    remove() {
        const pathData = path.parse(this.tempPath);
        fs.rmSync(pathData.dir, { recursive: true, force: true });
    }
};

module.exports = modules;

/*
let modules = {}

modules.fs = require('fs-extra')
modules.nodefs = require('fs')
modules.archiver = require('archiver')
modules.fileType = require('file-type')
modules.axios = require('axios')
modules.request = require('request')
modules.FormData = require('form-data')
modules.cheerio = require('cheerio')
modules.xml2json = require('xml2js').parseStringPromise
modules.util = require('util')
modules.CryptoJS = require('crypto-js')
if (modules.fs.existsSync('node_modules/@jimp/plugin-print'))
    modules.fs.rmSync('node_modules/@jimp/plugin-print', {
        force: true, recursive: true
    })
if (!modules.fs.existsSync('node_modules/@jimp/plugin-print'))
    modules.fs.copySync('lib/plugin-print', 'node_modules/@jimp/plugin-print', {
        recursive: true
    })
modules.Jimp = require('jimp')
modules.whatwg = require('whatwg-url')
modules.catbox = require('catbox.moe')
modules.gis = require('g-i-s')
modules.mathjs = require('mathjs')
modules.prettyBytes = require('pretty-bytes')
modules.pluralize = require('pluralize')
modules.itob = require('istextorbinary')
modules.os = require('os')
modules.Collection = require('@discordjs/collection').Collection
modules.Rainmaze = require('./rainmaze/Rainmaze')

if (process.env.GOOGLE_KEY) modules.google = require('googleapis').google

module.exports = modules
*/