import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { utimes, utimesSync } from 'utimes';
import crypto from 'crypto';
import { addDownloadedIds, addMD5, getDownloadedIds, isMD5Downloaded } from './Database';
import { RedditData } from '../model/redditData';
import { getExtensionFromUrl, getMediaUrl } from './RedditService';

const _DOWNLOADPATH = process.env.DOWNLOAD_FOLDER ?? './downloads/';
const _MAX_THREADS = 5;
const _THREAD_QUEUE: Array<() => Promise<void>> = [];
let _CURRENT_THREADS = 0;
const downloadedIds: string[] = [];
const downloadedMD5s: string[] = [];

(async() => {
    downloadedIds.push(...await getDownloadedIds());
})();

// TODO check md5 of files, to remove duplicates

// export const downloadFile = async (url: string, id: string, title: string, extension: string, utime: number, subfolder: string|null = null): Promise<string> => {
//     return new Promise((res, rej) => {
//         const downloadfolder = subfolder ? path.join(_DOWNLOADPATH, subfolder) : _DOWNLOADPATH;
//         let filename = removeInvalidChars(title).substring(0, 240).trim();

//         fs.mkdirSync(downloadfolder, { recursive: true });

//         if(fs.existsSync(path.join(downloadfolder, filename + '.' + extension)))
//             filename += '_' + id;


//         if(fs.existsSync(path.join(downloadfolder, filename + '.' + extension))) {
//             res(id);
//             return;
//         }

//         filename += '.' + extension;
//         fs.writeFileSync(path.join(downloadfolder, filename), '');

//         axios.get(url, {
//             responseType: 'stream',
//             timeout: 999999999
//         }).then(response => {
//             //response.data.pipe(fs.createWriteStream(path.join(downloadfolder, filename)));
//             const fileBufferArr: Uint8Array[] = [];
//             response.data.on('data', (chunk: Uint8Array) => {
//                 fileBufferArr.push(chunk);
//             });
//             response.data.on('end', () => {
//                 const fileBuffer = Buffer.concat(fileBufferArr);
//                 const md5 = getMD5(fileBuffer);

//                 if(md5AlreadyDownloaded(md5)) {
//                     fs.unlinkSync(path.join(downloadfolder, filename));
//                     res(id);
//                     return;
//                 }

//                 addMD5(md5);
//                 fs.writeFileSync(path.join(downloadfolder, filename), fileBuffer);

//                 utimesSync(path.join(downloadfolder, filename), utime*1000);
//                 console.log(`finished downloading: ${filename}`);
//                 res(id);
//             });
//         }).catch(err => {
//             console.error(err)
//             fs.unlinkSync(path.join(downloadfolder, filename));
//             rej();
//         });
//     });
// }

const _download = async (url: string, filePath: string, filename: string, extension: string, id: string, galleryTitle: string|null): Promise<void> => {
    return new Promise((res, rej) => {
        axios.get(url, {
            responseType: 'stream',
            timeout: 999999999
        }).then(response => {
            //response.data.pipe(fs.createWriteStream(path.join(downloadfolder, filename)));
            const fileBufferArr: Uint8Array[] = [];
            response.data.on('data', (chunk: Uint8Array) => {
                fileBufferArr.push(chunk);
            }).on('end', async () => {
                const fileBuffer = Buffer.concat(fileBufferArr);
                const md5 = getMD5(fileBuffer);

                if(downloadedMD5s.includes(md5) || (await isMD5Downloaded(md5))) {
                    res();
                    return;
                }
                downloadedMD5s.push(md5);
                addMD5(md5);

                let downloadfolder = galleryTitle ? path.join(filePath, galleryTitle) : filePath;
                let fullFilePath = path.join(downloadfolder, filename + '.' + extension);
                if(galleryTitle !== null) {
                    if(fs.existsSync(fullFilePath)){
                        downloadfolder += '_'+id;
                        fullFilePath = path.join(downloadfolder, filename + '.' + extension);
                        if (fs.existsSync(fullFilePath)) {
                            res();
                            return;
                        }
                    }
                }else if(fs.existsSync(fullFilePath)){
                    fullFilePath = path.join(downloadfolder, filename + '_' + id + '.' + extension);

                    if(fs.existsSync(fullFilePath)){
                        res();
                        return;
                    }
                }

                fs.mkdirSync(downloadfolder, { recursive: true });
                try {
                    fs.writeFileSync(fullFilePath, fileBuffer);
                } catch (error: any) {
                    if(error.code !== 'EISDIR') {
                        throw error;
                    }else{
                        fs.unlinkSync(fullFilePath);
                        const index = downloadedMD5s.indexOf(md5);
                        if(index !== -1)
                            downloadedMD5s.splice(index, 1);

                        rej('EISDIR');
                        return;
                    }
                }
                res();
            });
        }).catch(err => {
            console.error(err)
            rej();
        });
    })
}

export const downloadFilev2 = async (post: RedditData, subfolder: string): Promise<void> => {
    const downloadPromises: Array<Promise<void>> = [];

    if (!downloadedIds.includes(post.name)) {
        const urls = getMediaUrl(post);
        urls.forEach((url, index) => {
            const extension = getExtensionFromUrl(url);
            if (extension && (post.title || post.link_title)) {
                const thread = generateDownloadPromise(url, index, subfolder, post);
                
                if(thread)
                    downloadPromises.push(thread);
            }
        });
    }

    //addDownloadedIds([post.name]);
    return Promise.all(downloadPromises).then(() => {});

    //const downloadPromise = waitForThread(() => downloadFile(url, post.name,, extension, utime, subreddit.name));


}

const generateDownloadPromise = (url: string, index: number, subfolder: string, post: RedditData) => {
    const extension = getExtensionFromUrl(url);
    if (extension && (post.title || post.link_title)) {
        const title = removeInvalidChars((post.title ?? post.link_title) as string).substring(0, 240).trim();;
        const fileName = post.is_gallery ? index.toString() : title;
        //const filePath = path.join(subfolder ? path.join(_DOWNLOADPATH, subfolder) : _DOWNLOADPATH, fileName);
        const filePath = path.join(_DOWNLOADPATH, subfolder);

        return waitForThread(() => _download(url, filePath, fileName, extension, post.name, post.is_gallery ? title : null)).catch(err => {
            if(err === 'EISDIR'){
                console.log(`${post.title ?? post.link_title} - ${index} failed to download, retrying in 1 second...`);
                setTimeout(() => {
                    generateDownloadPromise(url, index, subfolder, post)?.then(() => console.log(`${post.title ?? post.link_title} - ${index} successfully downloaded`));
                }, 1000);
            }
        });
    }

    return null;
}

const waitForThread = async (func: () => Promise<void>): Promise<void> => {
    _THREAD_QUEUE.push(func);
    while (_CURRENT_THREADS >= _MAX_THREADS) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    _CURRENT_THREADS++;

    const nextFunc = _THREAD_QUEUE.shift();

    return nextFunc!().finally(() => _CURRENT_THREADS--);
}

const removeInvalidChars = (str: string): string => {
    return str.replace(/[^\w\.!@#$^+=-\s]/g, '');
}

const getMD5 = (fileBuffer: Buffer) => {
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

fs.mkdirSync(_DOWNLOADPATH, { recursive: true });