"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExtensionFromUrl = exports.getJsonFromSubreddit = exports.getMediaUrl = void 0;
const axios_1 = __importDefault(require("axios"));
const getMediaUrl = (post) => {
    var _a, _b, _c, _d, _e;
    if (post.is_gallery) {
        return getGalleryImages(post);
    }
    if (post.is_video) {
        return [fixURL(post.media.reddit_video.fallback_url)];
    }
    if ((post === null || post === void 0 ? void 0 : post.url_overridden_by_dest) && hasMediaExtension(post.url_overridden_by_dest))
        return [fixURL(post.url_overridden_by_dest)]; // Check if extension is correct
    if ((_b = (_a = post === null || post === void 0 ? void 0 : post.preview) === null || _a === void 0 ? void 0 : _a.reddit_video_preview) === null || _b === void 0 ? void 0 : _b.fallback_url)
        return [fixURL(post.preview.reddit_video_preview.fallback_url)];
    if (post === null || post === void 0 ? void 0 : post.link_url)
        return [fixURL(post.link_url)];
    if ((_e = (_d = (_c = post === null || post === void 0 ? void 0 : post.preview) === null || _c === void 0 ? void 0 : _c.images[0]) === null || _d === void 0 ? void 0 : _d.source) === null || _e === void 0 ? void 0 : _e.url)
        return [fixURL(post.preview.images[0].source.url)];
    return [];
};
exports.getMediaUrl = getMediaUrl;
const getJsonFromSubreddit = (subreddit) => {
    return axios_1.default.get(`https://www.reddit.com/${subreddit}.json`, {
        responseType: 'json'
    })
        .then((resp) => {
        const posts = resp.data.data.children.map((post) => post.data);
        return posts;
    });
};
exports.getJsonFromSubreddit = getJsonFromSubreddit;
const hasMediaExtension = (url) => {
    const extension = (0, exports.getExtensionFromUrl)(url);
    if (extension) {
        return extension.toLowerCase() === 'jpg' || extension.toLowerCase() === 'png' || extension.toLowerCase() === 'gif' || extension.toLowerCase() === 'jpeg' || extension.toLowerCase() === 'webm' || extension.toLowerCase() === 'mp4' || extension.toLowerCase() === 'gifv' || extension.toLowerCase() === 'mpg' || extension.toLowerCase() === 'mpeg' || extension.toLowerCase() === 'gif' || extension.toLowerCase() === 'mov' || extension.toLowerCase() === 'mkv' || extension.toLowerCase() === 'avi' || extension.toLowerCase() === 'wmv' || extension.toLowerCase() === 'flv' || extension.toLowerCase() === 'm4v' || extension.toLowerCase() === 'swf' || extension.toLowerCase() === '3gp' || extension.toLowerCase() === '3g2';
    }
    return false;
};
const getExtensionFromUrl = (url) => {
    const regex = /.+\/.+\.(.+?)(\?|$)/gim;
    const match = regex.exec(url);
    if (match) {
        return match[1];
    }
    return null;
};
exports.getExtensionFromUrl = getExtensionFromUrl;
const getGalleryImages = (post) => {
    if (post.media_metadata && Object.keys(post.media_metadata).length > 0) {
        const values = [];
        for (const key in post.media_metadata) {
            values.push(post.media_metadata[key]);
        }
        return values.map(metadata => fixURL(metadata.s.u));
    }
    return [];
};
const fixURL = (url) => {
    return url.replace(/amp;/g, '');
};
