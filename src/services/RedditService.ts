import axios from "axios";
import { RedditData } from "../model/redditData";

export const getMediaUrl = (post: RedditData): Array<string> => {
    if(post.is_gallery) {
        return getGalleryImages(post);
    }

    if(post.is_video) {
        return [fixURL(post.media.reddit_video.fallback_url)];
    }

    if(post?.url_overridden_by_dest && hasMediaExtension(post.url_overridden_by_dest)) return [fixURL(post.url_overridden_by_dest)]; // Check if extension is correct
    if(post?.preview?.reddit_video_preview?.fallback_url) return [fixURL(post.preview.reddit_video_preview.fallback_url)];
    if(post?.link_url) return [fixURL(post.link_url)];
    if(post?.preview?.images[0]?.source?.url) return [fixURL(post.preview.images[0].source.url)];

    return [];
}

export const getJsonFromSubreddit = (subreddit: string): Promise<RedditData[]> => {
    return axios.get(`https://www.reddit.com/${subreddit}.json`, {
        responseType: 'json'
    })
        .then((resp: any) => {
            const posts: RedditData[] = resp.data.data.children.map((post: any) => post.data);

            return posts;
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
    const regex = /.+\/.+\.(.+?)(\?|$)/gim;
    const match = regex.exec(url);
    if(match) {
        return match[1];
    }
    return null;
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