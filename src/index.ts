require('dotenv').config()

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { downloadFilev2 } from "./services/Download";
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
});


const getFeed = () => {
    const utime = +new Date() / 1000;
    const subreddits = getSubreddits();
    const feedPromises = [];
    const downloadPromises: Array<Promise<void>> = [];
    const downloadedIds = getDownloadedIds();

    for (const subreddit of subreddits) {
        const fetchOlderPosts = subreddit.fetchOlderPosts && subreddit.lastUpdate < 0;
        const promise = getJsonFromSubreddit(subreddit.url, subreddit.lastID, fetchOlderPosts).then(posts => {
            posts.forEach(post => {
                const downloadPromise = downloadFilev2(post, subreddit.name);
                downloadPromises.push(downloadPromise);

                downloadPromise.then(() => {
                    addDownloadedIds([post.name]);
                    const indexOfPost = posts.findIndex(p => p.name === post.name);
                    const oldIndexOfPost = posts.findIndex(p => p.name === subreddit.lastID);
                    if(indexOfPost > oldIndexOfPost || oldIndexOfPost === -1){
                        subreddit.lastID = post.name;
                        updateSingleSubreddit(subreddit.name, subreddit);
                    }
                })
            });

            // if(posts.length > 0) {
            //     subreddit.lastID = posts[posts.length-1].name;
            //     updateSingleSubreddit(subreddit.name, subreddit);
            // }
        });

        feedPromises.push(promise);
    }

    Promise.all(feedPromises).then(() => {
        console.log('All feeds fetched');
        updateAllSubreddits();

        Promise.all(downloadPromises).then((values) => {
            //addDownloadedIds(values);
            console.log('All files downloaded');
            
            setTimeout(getFeed, 1000 * 60 * 30); // Get all feeds every half hour
        });
    });
}