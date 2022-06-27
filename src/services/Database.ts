import { Collection, Document, MongoClient } from 'mongodb';
import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig'
import { AddSubredditRequest } from '../model/AddSubredditRequest';

const db = new JsonDB(new Config("./database/database", true, true, '/'));
const mongoClient = new MongoClient(process.env.MONGO_URI!);

let mongoMD5Collection: Collection<Document> | null = null;
let mongoIDCollection: Collection<Document> | null = null;

((async () => {
    await mongoClient.connect();
    const mongoDb = mongoClient.db('reddit_downloader');
    mongoMD5Collection = mongoDb.collection('md5');
    mongoIDCollection = mongoDb.collection('ids');
}))();


abstract class Subreddit {
    "name": string;
    "url": string;
    "fetchOlderPosts": boolean;
    "lastUpdate": number;
    "lastID": string;
}

export const addSubreddits = (request: AddSubredditRequest): void => {
    const subreddits = getSubreddits();

    const newSubreddits: Array<Subreddit> = request.subreddits.filter(sub => subreddits.find(s => s.name === sub.name) == undefined).map(sub => {
        return {
            "name": sub.name,
            "url": `r/${sub.name}`,
            "fetchOlderPosts": sub.fetchOlderPosts,
            "lastUpdate": -1,
            "lastID": ''
        }
    });

    const newUsers: Array<Subreddit> = request.users.filter(sub => subreddits.find(s => s.name === sub.name) == undefined).map(sub => {
        return {
            "name": sub.name,
            "url": `u/${sub.name}`,
            "fetchOlderPosts": sub.fetchOlderPosts,
            "lastUpdate": -1,
            "lastID": ''
        }
    });

    db.push('/subreddits', [...newSubreddits, ...newUsers], false);
}

export const getSubreddits = (): Subreddit[] => {
    try {
        return db.getData('/subreddits');
    } catch (error) {
        return [];
    }
}

export const getSubreddit = (subreddit: string): Subreddit | undefined => {
    try {
        return db.getData("/subreddits[" + db.getIndex("/subreddits", subreddit, 'name') + "]");
    } catch (error) {
        return undefined;
    }
}

export const removeSubreddit = (subreddit: string): void => {
    db.delete("/subreddits[" + db.getIndex("/subreddits", subreddit, 'name') + "]");
}

export const updateAllSubreddits = (): void => {
    const subreddits = getSubreddits();
    const time = +new Date();

    subreddits.forEach(sub => {
        sub.lastUpdate = time
    });

    db.push('/subreddits', subreddits, true);
}

export const updateSingleSubreddit = (subreddit: string, newData: Subreddit): void => {
    const subreddits = getSubreddits();

    const index = db.getIndex("/subreddits", subreddit, 'name');
    subreddits[index] = newData;


    db.push('/subreddits', subreddits, true);
}

export const getDownloadedIds = async (): Promise<Array<string>> => {
    while(mongoIDCollection == null) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const ids = await mongoIDCollection.find({}).toArray();
    return [];
}

export const addMD5 = async(md5: string): Promise<void> => {
    while(mongoMD5Collection == null) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await mongoMD5Collection.insertOne({ md5 });
}

export const isMD5Downloaded = async (md5: string): Promise<boolean> => {
    while(mongoMD5Collection == null) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const found = await mongoMD5Collection.findOne({ md5 });
    return found != undefined;
}

// export const getDownloadedMD5s = (): Array<string> => {
//     try {
//         return db.getData('/hashes');
//     } catch (error) {
//         return [];
//     }
// }

// export const md5AlreadyDownloaded = (id: string): boolean => {
//     return getDownloadedMD5s().includes(id);
// }

// export const addMD5 = (md5: string): void => {
//     db.push('/hashes', [md5], false);
// }

// export const setDownloadedMD5s = (md5s: Array<string>): void => {
//     db.push('/hashes', md5s, true);
// }

export const addDownloadedIds = async (ids: Array<string>): Promise<void> => {
    while(mongoIDCollection == null) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const idsToAdd = ids.map(id => {
        return {id}
    });
    await mongoIDCollection.insertMany(idsToAdd);
}