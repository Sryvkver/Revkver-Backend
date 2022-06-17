import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { utimes, utimesSync } from 'utimes';
import crypto from 'crypto';
import { addDownloadedIds, getDownloadedIds } from './Database';
import { RedditData } from '../model/redditData';
import { getExtensionFromUrl, getMediaUrl } from './RedditService';

const _DOWNLOADPATH = process.env.DOWNLOAD_FOLDER ?? './downloads/';
const _MAX_THREADS = 5;
const _THREAD_QUEUE: Array<() => Promise<void>> = [];
let _CURRENT_THREADS = 0;
const downloadedIds = getDownloadedIds();
const downloadedMD5s: Array<string> = [];

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

const _download = async (url: string, filePath: string, filename: string, extension: string, id: string, subfolder: string|null): Promise<void> => {
    return new Promise((res, rej) => {
        let downloadfolder = subfolder ? path.join(_DOWNLOADPATH, subfolder) : _DOWNLOADPATH;
        if(subfolder){

            if(fs.existsSync(downloadfolder) && (!fs.statSync(downloadfolder).isDirectory || fs.existsSync(path.join(downloadfolder, filename + '.' + extension))))
                downloadfolder += path.join(_DOWNLOADPATH, subfolder, id);
    
            if(!fs.existsSync(downloadfolder))
                fs.mkdirSync(downloadfolder, { recursive: true });
        }

        if(fs.existsSync(path.join(downloadfolder, filename + '.' + extension)))
            filename += '_' + id;


        if(fs.existsSync(path.join(downloadfolder, filename + '.' + extension))) {
            res();
            return;
        }

        filename += '.' + extension;
        console.log('Starting download: ' + filename);
        const fileLocation = path.join(downloadfolder, filename);
        fs.writeFileSync(fileLocation, '');

        axios.get(url, {
            responseType: 'stream',
            timeout: 999999999
        }).then(response => {
            //response.data.pipe(fs.createWriteStream(path.join(downloadfolder, filename)));
            const fileBufferArr: Uint8Array[] = [];
            response.data.on('data', (chunk: Uint8Array) => {
                fileBufferArr.push(chunk);
            });
            response.data.on('end', () => {
                const fileBuffer = Buffer.concat(fileBufferArr);
                const md5 = getMD5(fileBuffer);

                if(downloadedMD5s.includes(md5)) {
                    fs.unlinkSync(fileLocation);
                    res();
                    return;
                }
                downloadedMD5s.push(md5);
                console.log('Writing file: ' + fileLocation);
                fs.open(fileLocation, 'w', (err, fd) => {
                    if(err) {
                        console.error(err);
                        rej();
                        return;
                    }
                    fs.write(fd, fileBuffer, 0, fileBuffer.length, 0, (err) => {
                        if(err) {

                            console.error(err);
                            rej();
                            return;
                        }
                        fs.close(fd, (err) => {
                            if(err) {
                                console.error(err);
                                rej();
                                return;
                            }
                            console.log('Finished downloading: ' + fileLocation);
                            //res();
                        });
                    });
                }
                );
                //fs.writeFileSync(fileLocation, fileBuffer);

                //utimesSync(fileLocation, utime*1000);
                //console.log(`finished downloading: ${filename}`);
                res();
            });
        }).catch(err => {
            console.error(err)
            try {
                fs.unlinkSync(fileLocation);
            } catch (error) {}
            rej();
        });
    });
}

export const downloadFilev2 = async (post: RedditData, subfolder: string): Promise<void> => {
    const downloadPromises: Array<Promise<void>> = [];

    if (!downloadedIds.includes(post.name)) {
        const urls = getMediaUrl(post);
        urls.forEach((url, index) => {
            const extension = getExtensionFromUrl(url);
            if (extension && (post.title || post.link_title)) {
                const title = removeInvalidChars((post.title ?? post.link_title) as string).substring(0, 240).trim();;
                const fileName = post.is_gallery ? index.toString() : title;
                //const filePath = path.join(subfolder ? path.join(_DOWNLOADPATH, subfolder) : _DOWNLOADPATH, fileName);
                const filePath = path.join(_DOWNLOADPATH, subfolder);

                downloadPromises.push(
                    waitForThread(() => _download(url, filePath, fileName, extension, post.name, post.is_gallery ? title : null))
                )
            }
        });
    }

    addDownloadedIds([post.name]);
    return Promise.all(downloadPromises).then(() => {});

    //const downloadPromise = waitForThread(() => downloadFile(url, post.name,, extension, utime, subreddit.name));


}

const waitForThread = async (func: () => Promise<void>): Promise<void> => {
    _THREAD_QUEUE.push(func);
    while (_CURRENT_THREADS >= 5) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    }
    _CURRENT_THREADS++;

    const nextFunc = _THREAD_QUEUE.shift();

    return nextFunc!().catch(err => {console.log(err); return;}).finally(() => _CURRENT_THREADS--);
}

const removeInvalidChars = (str: string): string => {
    return str.replace(/[^\w\.!@#$^+=-\s]/g, '');
}

const getMD5 = (fileBuffer: Buffer) => {
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

const readAllFilesOfDir = (dir: string): Array<string> => {
    const files = fs.readdirSync(dir);
    const result: Array<string> = [];
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isFile()) {
            result.push(filePath);
        } else {
            result.push(...readAllFilesOfDir(filePath));
        }
    });
    return result;
}

const updateMD5Database = async (): Promise<void> => {
    return new Promise((res, rej) => {
        const files = readAllFilesOfDir(_DOWNLOADPATH);
        const md5s = files.map(filepath => getMD5(fs.readFileSync(filepath)));
        downloadedMD5s.push(...md5s);
        //const oldMd5s = getDownloadedMD5s();

        //const set = new Set([...md5s, ...oldMd5s]);
        //setDownloadedMD5s(Array.from(set));

        res();
    })
}

export const initDownloader = (): Promise<unknown> => {
    return updateMD5Database();
}

fs.mkdirSync(_DOWNLOADPATH, { recursive: true });