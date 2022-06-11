require('dotenv').config()

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { downloadFile } from "./services/Download";
import { getExtensionFromUrl, getJsonFromSubreddit, getMediaUrl } from "./services/RedditService"
import { addDownloadedIds, addSubreddits, getDownloadedIds, getSubreddits, updateAllSubreddits, updateSingleSubreddit } from './services/Database';
import { AddSubredditRequest } from './model/AddSubredditRequest';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.post('/login', (req, res) => {
    res.send('ok');
});

app.post('/add', (req, res) => {
    if (req.body) {
        const requestData = req.body as AddSubredditRequest;
        addSubreddits(requestData);
        getFeed();
    }

    res.send('ok');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    getFeed();
    //setInterval(getFeed, 1000 * 60 * 30); // Get all feeds every half hour
});

let _CURRENT_THREADS = 0;

const getFeed = () => {
    const utime = +new Date() / 1000;
    const subreddits = getSubreddits();
    const feedPromises = [];
    const downloadPromises: Array<Promise<string>> = [];
    const downloadedIds = getDownloadedIds();

    for (const subreddit of subreddits) {
        const fetchOlderPosts = subreddit.fetchOlderPosts && subreddit.lastUpdate < 0;
        const promise = getJsonFromSubreddit(subreddit.url, subreddit.lastID, fetchOlderPosts).then(posts => {
            if(posts.length > 0) {
                subreddit.lastID = posts[0].name;
                updateSingleSubreddit(subreddit.name, subreddit);
            }

            posts.forEach(post => {
                if(!downloadedIds.includes(post.name)) {
                    const urls = getMediaUrl(post);
                    urls.forEach(url => {
                        const extension = getExtensionFromUrl(url);
                        if (extension && (post.title || post.link_title)) {
                            //const downloadPromise = downloadFile(url, post.name, (post.title ?? post.link_title) as string, extension, utime, subreddit.name).catch(err => {console.log(err); return '';});
                            const downloadPromise = waitForThread(() => downloadFile(url, post.name, (post.title ?? post.link_title) as string, extension, utime, subreddit.name));
                            downloadPromise.finally(() => {
                                _CURRENT_THREADS--;
                            });

                            downloadPromises.push(downloadPromise);
                        }
                    });
                }
            });
        });

        feedPromises.push(promise);
    }

    Promise.all(feedPromises).then(() => {
        console.log('All feeds fetched');
        updateAllSubreddits();

        Promise.all(downloadPromises).then((values) => {
            addDownloadedIds(values);
            console.log('All files downloaded');
            
            setTimeout(getFeed, 1000 * 60 * 30); // Get all feeds every half hour
        });
    });
}

const waitForThread = async (func: () => Promise<string>): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    while (_CURRENT_THREADS >= 5) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    }
    _CURRENT_THREADS++;

    return func().catch(err => {console.log(err); return '';});
}