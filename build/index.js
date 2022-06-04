"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Download_1 = require("./services/Download");
const RedditService_1 = require("./services/RedditService");
const getFeed = () => {
    (0, RedditService_1.getJsonFromSubreddit)('r/aww').then(posts => {
        posts.forEach(post => {
            const urls = (0, RedditService_1.getMediaUrl)(post);
            urls.forEach(url => {
                var _a;
                const extension = (0, RedditService_1.getExtensionFromUrl)(url);
                if (extension && (post.title || post.link_title)) {
                    (0, Download_1.downloadFile)(url, ((_a = post.title) !== null && _a !== void 0 ? _a : post.link_title), extension, 'aww');
                }
            });
        });
    });
};
getFeed();
