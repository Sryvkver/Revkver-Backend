import axios from "axios";
import { RedditData } from "../model/redditData";


const client = axios.create({headers: {
    Cookie: process.env.REDDIT_COOKIE ?? '',
}, withCredentials: true});


export const getMediaUrl = (post: RedditData): Array<string> => {
    if(post.is_gallery) {
        return getGalleryImages(post);
    }

    if(post.is_video) {
        return [fixURL(post.media.reddit_video.fallback_url)];
    }

    if(post?.url_overridden_by_dest && hasMediaExtension(post.url_overridden_by_dest)) return [fixURL(post.url_overridden_by_dest)]; // Check if extension is correct
    if(post?.preview?.reddit_video_preview?.fallback_url) return [fixURL(post.preview.reddit_video_preview.fallback_url)];
    if(post?.link_url && hasMediaExtension(post.link_url)) return [fixURL(post.link_url)];
    if(post?.preview?.images[0]?.source?.url) return [fixURL(post.preview.images[0].source.url)];

    return [];
}

export const getJsonFromSubreddit = (subreddit: string, lastID: string = '', fetchOlderPosts: boolean = false, after: string = ''): Promise<RedditData[]> => {
    let url = `https://www.reddit.com/${subreddit}/${!fetchOlderPosts && !subreddit.startsWith('u/') ? 'new/' : ''}.json?limit=999`;

    if(!fetchOlderPosts && !!lastID) {
        url = `${url}&before=${lastID}`;
    }

    if(fetchOlderPosts) {
        url = `${url}&after=${after}`;
    }

    return client.get(url, {
        
        responseType: 'json'
    })
        .then(async (resp: any) => {
            const posts: RedditData[] = resp.data.data.children.filter((post: any) => post.kind === 't3').map((post: any) => post.data);
            const newAfter = resp.data.data.after;
            const newBefore = resp.data.data.before;
            if(fetchOlderPosts)
                console.log(`[RedditService] Current after ${after}; new after ${newAfter} from ${subreddit}`);
            else
                console.log(`[RedditService] Current before ${lastID}; new before ${newBefore} from ${subreddit}`);

            if(fetchOlderPosts && newAfter) {
                const olderPosts = await getJsonFromSubreddit(subreddit, lastID, true, newAfter);
                return posts.concat(olderPosts);
            }else if(newBefore){
                const newerPosts = await getJsonFromSubreddit(subreddit, newBefore);
                return posts.concat(newerPosts);
            }

            return posts.sort((a: RedditData, b: RedditData) => {
                return b.created - a.created;
            });
        });
}

const hasMediaExtension = (url: string): boolean => {
    const extension = getExtensionFromUrl(url);
    if(extension) {
        return extension.toLowerCase() === 'jpg' || extension.toLowerCase() === 'png' || extension.toLowerCase() === 'gif' || extension.toLowerCase() === 'jpeg' || extension.toLowerCase() === 'webm' || extension.toLowerCase() === 'mp4' || extension.toLowerCase() === 'gifv' || extension.toLowerCase() === 'mpg' || extension.toLowerCase() === 'mpeg' || extension.toLowerCase() === 'gif' || extension.toLowerCase() === 'mov' || extension.toLowerCase() === 'mkv' || extension.toLowerCase() === 'avi' || extension.toLowerCase() === 'wmv' || extension.toLowerCase() === 'flv' || extension.toLowerCase() === 'm4v' || extension.toLowerCase() === 'swf' || extension.toLowerCase() === '3gp' || extension.toLowerCase() === '3g2';
    }
    return false;
}

export const getExtensionFromUrl = (url: string): string|null => {
    //const regex = /.+\/.+\.(.+?)(\?|$)/gim;
    const regex = /.+\/.+\.(?!.+\/)(.+?)(\?|$)/gim;
    const match = regex.exec(url);
    if(match) {
        return match[1];
    }
    return url.includes('v.redd.it') && url.includes('DASH') ? 'mp4' : null;
}

const getGalleryImages = (post: RedditData): Array<string> => {
    if(post.media_metadata && Object.keys(post.media_metadata as any).length > 0) {
        const values: Array<{
            status: string;
            e: string;
            m: string;
            p: {
                y: number;
                x: number;
                u: string;
            }[];
            s: {
                y: number;
                x: number;
                u: string;
            };
            id: string;
        }>  = [];
        
        for(const key in post.media_metadata) {
            values.push(post.media_metadata[key]);
        }

        return values.map(metadata => fixURL(metadata.s.u));
    }

    return [];
}

const fixURL = (url: string): string => {
    return url.replace(/amp;/g, '');
}