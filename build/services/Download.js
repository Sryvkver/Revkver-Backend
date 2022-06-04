"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const _DOWNLOADPATH = './downloads/';
const downloadFile = (url, title, extension, subfolder = null) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((res, rej) => {
        const downloadfolder = subfolder ? path_1.default.join(_DOWNLOADPATH, subfolder) : _DOWNLOADPATH;
        const filename = removeInvalidChars(title).substring(0, 240).trim() + '.' + extension;
        fs_1.default.mkdirSync(downloadfolder, { recursive: true });
        if (fs_1.default.existsSync(path_1.default.join(downloadfolder, filename))) {
            res();
            return;
        }
        fs_1.default.writeFileSync(path_1.default.join(downloadfolder, filename), '');
        axios_1.default.get(url, {
            responseType: 'stream'
        }).then(response => {
            response.data.pipe(fs_1.default.createWriteStream(path_1.default.join(downloadfolder, filename)));
            response.data.on('end', () => {
                console.log(`finished downloading: ${filename}`);
                res();
            });
        }).catch(err => {
            console.error(err);
            fs_1.default.unlinkSync(path_1.default.join(downloadfolder, filename));
            rej();
        });
    });
});
exports.downloadFile = downloadFile;
const removeInvalidChars = (str) => {
    return str.replace(/[^\w\.!@#$^+=-\s]/g, '');
};
fs_1.default.mkdirSync(_DOWNLOADPATH, { recursive: true });
