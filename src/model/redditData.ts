export abstract class RedditData {
    "is_gallery": boolean;
    "approved_at_utc": string | null;
    "subreddit": string;
    "selftext": string;
    "author_fullname": string;
    "saved": boolean;
    "mod_reason_title": string | null;
    "gilded": number;
    "clicked": boolean;
    "title": string | null;
    "link_title": string | null;
    "link_flair_richtext": Array<{
        'e': string;
        't': string;
    }>;
    "subreddit_name_prefixed": string;
    "hidden": boolean;
    "pwls": number;
    "link_flair_css_class": string | null;
    "downs": number;
    "thumbnail_height": number | null;
    "top_awarded_type": string | null;
    "hide_score": boolean;
    "name": string;
    "quarantine": boolean;
    "link_flair_text_color": string | null;
    "upvote_ratio": number;
    "author_flair_background_color": string | null;
    "subreddit_type": string;
    "ups": number;
    "total_awards_received": number;
    "media_embed": {
        "content": string;
        "width": number;
        "scrolling": boolean;
        "height": number;
    };
    "thumbnail_width": number | null;
    "author_flair_template_id": string | null;
    "is_original_content": boolean;
    "user_reports": Array<{
        'reason': string;
        'created_utc': number;
        'id': string;
        'user': string;
    }>;
    "secure_media": {
        'oembed': {
            'provider_url': string;
            'description': string;
            'title': string;
            'thumbnail_width': number;
            'height': number;
            'width': number;
            'html': string;
            'version': string;
            'author_name': string;
            'thumbnail_url': string;
            'type': string;
            'provider_name': string;
            'thumbnail_height': number;
        };
        'type': string;
    };
    "is_reddit_media_domain": boolean;
    "is_meta": boolean;
    "category": string | null;
    "secure_media_embed": {
        "content": string;
        "width": number;
        "scrolling": boolean;
        "media_domain_url": string;
        "height": number;
    };
    "link_flair_text": string | null;
    "can_mod_post": boolean;
    "score": number;
    "approved_by": string | null;
    "is_created_from_ads_ui": boolean;
    "author_premium": boolean;
    "thumbnail": string | null;
    "edited": boolean;
    "author_flair_css_class": string | null;
    "author_flair_richtext": Array<{
        'e': string;
        't': string;
    }>;
    "gildings": unknown;
    "post_hint": string;
    "content_categories": string | null;
    "is_self": boolean;
    "mod_note": string | null;
    "created": number;
    "link_flair_type": string | null;
    "wls": number;
    "removed_by_category": string | null;
    "banned_by": string | null;
    "author_flair_type": string | null;
    "domain": string;
    "allow_live_comments": boolean;
    "is_crosspostable": boolean;
    "pinned": boolean;
    "over_18": boolean;
    "preview": {
        "images": [
            {
                "source": {
                    "url": string;
                    "width": number;
                    "height": number;
                };
                "resolutions": [
                    {
                        "url": string;
                        "width": number;
                        "height": number;
                    }
                ];
                "variants": unknown;
                "id": string;
            }
        ];
        "reddit_video_preview": {
            "bitrate_kbps": number;
            "fallback_url": string;
            "height": number;
            "width": number;
            "scrubber_media_url": string;
            "dash_url": string;
            "duration": number;
            "hls_url": string;
            "is_gif": boolean;
            "transcoding_status": string;
        }
        "enabled": boolean;
    };
    "media_only": boolean;
    "link_flair_template_id": string | null;
    "can_gild": boolean;
    "spoiler": boolean;
    "locked": boolean;
    "author_flair_text": string | null;
    "treatment_tags": Array<{
        'tag': string;
        'description': string;
    }>;
    "visited": boolean;
    "removed_by": string | null;
    "num_reports": string | null;
    "distinguished": string | null;
    "subreddit_id": string;
    "author_is_blocked": boolean;
    "mod_reason_by": string | null;
    "removal_reason": string | null;
    "link_flair_background_color": string | null;
    "url_overridden_by_dest": string | null;
    "id": string;
    "is_robot_indexable": boolean;
    "report_reasons": string | null;
    "author": string;
    "discussion_type": string | null;
    "num_comments": number;
    "send_replies": boolean;
    "whitelist_status": string | null;
    "contest_mode": boolean;
    "author_patreon_flair": boolean;
    "author_flair_text_color": string | null;
    "permalink": string;
    "parent_whitelist_status": string | null;
    "stickied": boolean;
    "url": string;
    "subreddit_subscribers": number;
    "created_utc": number;
    "num_crossposts": number;
    "media": {
        "reddit_video": {
            "bitrate_kbps": number;
            "fallback_url": string;
            "height": number;
            "width": number;
            "scrubber_media_url": string;
            "dash_url": string;
            "duration": number;
            "hls_url": string;
            "is_gif": boolean;
            "transcoding_status": string;
          },
        'oembed': {
            'provider_url': string;
            'description': string;
            'title': string;
            'thumbnail_width': number;
            'height': number;
            'width': number;
            'html': string;
            'version': string;
            'author_name': string;
            'thumbnail_url': string;
            'type': string;
            'provider_name': string;
            'thumbnail_height': number;
        };
        'type': string;
    };
    "is_video": boolean;
    "media_metadata": any|null;
    "link_url": string;
}