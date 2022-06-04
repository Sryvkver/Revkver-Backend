import axios from 'axios';
import fs from 'fs';
import path from 'path';

const _DOWNLOADPATH = './downloads/';

export const downloadFile = async (url: string, title: string, extension: string, subfolder: string|null = null): Promise<void> => {
    return new Promise((res, rej) => {
        const downloadfolder = subfolder ? path.join(_DOWNLOADPATH, subfolder) : _DOWNLOADPATH;
        const filename = removeInvalidChars(title).substring(0, 240).trim() + '.' + extension;

        fs.mkdirSync(downloadfolder, { recursive: true });

        if(fs.existsSync(path.join(downloadfolder, filename))) {
            res();
            return;
        }
        fs.writeFileSync(path.join(downloadfolder, filename), '');

        axios.get(url, {
            responseType: 'stream'
        }).then(response => {
            response.data.pipe(fs.createWriteStream(path.join(downloadfolder, filename)));
            response.data.on('end', () => {
                console.log(`finished downloading: ${filename}`);
                res();
            });
        }).catch(err => {
            console.error(err)
            fs.unlinkSync(path.join(downloadfolder, filename));
            rej();
        });
    });
}

const removeInvalidChars = (str: string): string => {
    return str.replace(/[^\w\.!@#$^+=-\s]/g, '');
}

fs.mkdirSync(_DOWNLOADPATH, { recursive: true });