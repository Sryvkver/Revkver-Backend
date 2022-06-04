import { downloadFile } from "./services/Download";
import { getExtensionFromUrl, getJsonFromSubreddit, getMediaUrl } from "./services/RedditService"

const getFeed = () => {
    getJsonFromSubreddit('r/aww').then(posts => {
        posts.forEach(post => {
            const urls = getMediaUrl(post);
            urls.forEach(url => {
                const extension = getExtensionFromUrl(url);
                if(extension && (post.title || post.link_title)) {
                    downloadFile(url, (post.title ?? post.link_title) as string, extension, 'aww');
                }
            });
        });
    });
}

getFeed();