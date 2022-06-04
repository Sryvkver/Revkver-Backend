import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { downloadFile } from "./services/Download";
import { getExtensionFromUrl, getJsonFromSubreddit, getMediaUrl } from "./services/RedditService"
import { addSubreddits, getSubreddits, updateAllSubreddits, updateSingleSubreddit } from './services/Database';
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
    setInterval(getFeed, 1000 * 60 * 30); // Get all feeds every half hour
});

const getFeed = () => {
    const subreddits = getSubreddits();
    const feedPromises = [];
    const downloadPromises: Array<Promise<void>> = [];

    for (const subreddit of subreddits) {
        const fetchOlderPosts = subreddit.fetchOlderPosts && subreddit.lastUpdate < 0;
        const promise = getJsonFromSubreddit(subreddit.url, subreddit.lastID, fetchOlderPosts).then(posts => {
            if(posts.length > 0) {
                subreddit.lastID = posts[0].name;
                updateSingleSubreddit(subreddit.name, subreddit);
            }

            posts.forEach(post => {
                const urls = getMediaUrl(post);
                urls.forEach(url => {
                    const extension = getExtensionFromUrl(url);
                    if (extension && (post.title || post.link_title)) {
                        const downloadPromise = downloadFile(url, (post.title ?? post.link_title) as string, extension, post.created, subreddit.name);
                        downloadPromises.push(downloadPromise);
                    }
                });
            });
        });

        feedPromises.push(promise);
    }

    Promise.all(feedPromises).then(() => {
        console.log('All feeds fetched');
        updateAllSubreddits();

        Promise.all(downloadPromises).then(() => {
            console.log('All files downloaded');
        });
    });
}