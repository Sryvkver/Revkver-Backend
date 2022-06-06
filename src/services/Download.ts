import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { utimes, utimesSync } from 'utimes';

const _DOWNLOADPATH = './downloads/';

// TODO check md5 of files, to remove duplicates

export const downloadFile = async (url: string, id: string, title: string, extension: string, utime: number, subfolder: string|null = null): Promise<string> => {
    return new Promise((res, rej) => {
        const downloadfolder = subfolder ? path.join(_DOWNLOADPATH, subfolder) : _DOWNLOADPATH;
        let filename = removeInvalidChars(title).substring(0, 240).trim();

        fs.mkdirSync(downloadfolder, { recursive: true });

        if(fs.existsSync(path.join(downloadfolder, filename + '.' + extension)))
            filename += '_' + id;


        if(fs.existsSync(path.join(downloadfolder, filename + '.' + extension))) {
            res(id);
            return;
        }

        filename += '.' + extension;
        fs.writeFileSync(path.join(downloadfolder, filename), '');

        axios.get(url, {
            responseType: 'stream',
            timeout: 999999999
        }).then(response => {
            response.data.pipe(fs.createWriteStream(path.join(downloadfolder, filename)));
            response.data.on('end', () => {
                utimesSync(path.join(downloadfolder, filename), utime*1000);
                console.log(`finished downloading: ${filename}`);
                res(id);
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