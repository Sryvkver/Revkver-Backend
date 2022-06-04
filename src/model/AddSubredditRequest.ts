export abstract class AddSubredditRequest {
	"subreddits": Array<{
        "name": string;
        "fetchOlderPosts": boolean;
    }>;
	"users": Array<{
        "name": string;
        "fetchOlderPosts": boolean;
    }>;
}