export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type NewsroomRole = "reporter" | "editor" | "admin";
export type ArticleStatus = "draft" | "in_review" | "published" | "archived";

type Relationship<ForeignKeyName extends string, Column extends string, ReferencedRelation extends string> = {
  foreignKeyName: ForeignKeyName;
  columns: [Column];
  isOneToOne: false;
  referencedRelation: ReferencedRelation;
  referencedColumns: [string];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string; role: NewsroomRole; avatar_url: string | null; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id: string; display_name: string; role?: NewsroomRole; avatar_url?: string | null; is_active?: boolean; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: { id: string; name: string; slug: string; description: string | null; color: string; sort_order: number; is_active: boolean; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; slug: string; description?: string | null; color?: string; sort_order?: number; is_active?: boolean; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [Relationship<"categories_created_by_fkey", "created_by", "profiles">];
      };
      articles: {
        Row: { id: string; author_id: string; editor_id: string | null; category_id: string | null; featured_media_id: string | null; title: string; slug: string; excerpt: string | null; body: Json; featured_image_url: string | null; image_caption: string | null; status: ArticleStatus; language_code: string; is_featured: boolean; is_breaking: boolean; is_sponsored: boolean; sponsor_name: string | null; seo_title: string | null; seo_description: string | null; scheduled_at: string | null; published_at: string | null; view_count: number; created_at: string; updated_at: string };
        Insert: { id?: string; author_id: string; editor_id?: string | null; category_id?: string | null; featured_media_id?: string | null; title: string; slug: string; excerpt?: string | null; body?: Json; featured_image_url?: string | null; image_caption?: string | null; status?: ArticleStatus; language_code?: string; is_featured?: boolean; is_breaking?: boolean; is_sponsored?: boolean; sponsor_name?: string | null; seo_title?: string | null; seo_description?: string | null; scheduled_at?: string | null; published_at?: string | null; view_count?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["articles"]["Insert"]>;
        Relationships: [
          Relationship<"articles_author_id_fkey", "author_id", "profiles">,
          Relationship<"articles_editor_id_fkey", "editor_id", "profiles">,
          Relationship<"articles_category_id_fkey", "category_id", "categories">,
        ];
      };
      media_assets: {
        Row: { id: string; uploaded_by: string; bucket_id: string; storage_path: string; kind: "image" | "video" | "audio" | "document"; mime_type: string; file_size_bytes: number; width: number | null; height: number | null; duration_seconds: number | null; alt_text: string | null; caption: string | null; credit: string | null; created_at: string };
        Insert: { id?: string; uploaded_by: string; bucket_id?: string; storage_path: string; kind: "image" | "video" | "audio" | "document"; mime_type: string; file_size_bytes: number; width?: number | null; height?: number | null; duration_seconds?: number | null; alt_text?: string | null; caption?: string | null; credit?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["media_assets"]["Insert"]>;
        Relationships: [Relationship<"media_assets_uploaded_by_fkey", "uploaded_by", "profiles">];
      };
      videos: {
        Row: { id: string; author_id: string; category_id: string | null; media_id: string | null; title: string; slug: string; description: string | null; provider: "youtube" | "facebook" | "vimeo" | "upload"; source_url: string | null; thumbnail_url: string | null; language_code: string; status: ArticleStatus; is_featured: boolean; published_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; author_id: string; category_id?: string | null; media_id?: string | null; title: string; slug: string; description?: string | null; provider?: "youtube" | "facebook" | "vimeo" | "upload"; source_url?: string | null; thumbnail_url?: string | null; language_code?: string; status?: ArticleStatus; is_featured?: boolean; published_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["videos"]["Insert"]>;
        Relationships: [Relationship<"videos_author_id_fkey", "author_id", "profiles">, Relationship<"videos_category_id_fkey", "category_id", "categories">, Relationship<"videos_media_id_fkey", "media_id", "media_assets">];
      };
      photo_stories: {
        Row: { id: string; author_id: string; category_id: string | null; cover_media_id: string | null; title: string; slug: string; description: string | null; language_code: string; status: ArticleStatus; published_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; author_id: string; category_id?: string | null; cover_media_id?: string | null; title: string; slug: string; description?: string | null; language_code?: string; status?: ArticleStatus; published_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["photo_stories"]["Insert"]>;
        Relationships: [Relationship<"photo_stories_author_id_fkey", "author_id", "profiles">, Relationship<"photo_stories_category_id_fkey", "category_id", "categories">, Relationship<"photo_stories_cover_media_id_fkey", "cover_media_id", "media_assets">];
      };
      photo_story_items: {
        Row: { id: string; story_id: string; media_id: string; position: number; caption: string | null; created_at: string };
        Insert: { id?: string; story_id: string; media_id: string; position?: number; caption?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["photo_story_items"]["Insert"]>;
        Relationships: [Relationship<"photo_story_items_story_id_fkey", "story_id", "photo_stories">, Relationship<"photo_story_items_media_id_fkey", "media_id", "media_assets">];
      };
      site_settings: {
        Row: { key: string; value: Json; updated_by: string | null; updated_at: string };
        Insert: { key: string; value?: Json; updated_by?: string | null; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>;
        Relationships: [Relationship<"site_settings_updated_by_fkey", "updated_by", "profiles">];
      };
      article_views: {
        Row: { article_id: string; viewer_key: string; created_at: string };
        Insert: { article_id: string; viewer_key: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      article_likes: {
        Row: { article_id: string; viewer_key: string; created_at: string };
        Insert: { article_id: string; viewer_key: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      article_comments: {
        Row: { id: string; article_id: string; viewer_key: string; commenter_name: string; body: string; status: "pending" | "approved" | "rejected"; moderated_by: string | null; approved_at: string | null; created_at: string };
        Insert: { id?: string; article_id: string; viewer_key: string; commenter_name: string; body: string; status?: "pending" | "approved" | "rejected"; moderated_by?: string | null; approved_at?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["article_comments"]["Insert"]>;
        Relationships: [Relationship<"article_comments_article_id_fkey", "article_id", "articles">, Relationship<"article_comments_moderated_by_fkey", "moderated_by", "profiles">];
      };
      tags: {
        Row: { id: string; name: string; slug: string; created_at: string };
        Insert: { id?: string; name: string; slug: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["tags"]["Insert"]>;
        Relationships: [];
      };
      article_tags: {
        Row: { article_id: string; tag_id: string };
        Insert: { article_id: string; tag_id: string };
        Update: Partial<Database["public"]["Tables"]["article_tags"]["Insert"]>;
        Relationships: [Relationship<"article_tags_article_id_fkey", "article_id", "articles">, Relationship<"article_tags_tag_id_fkey", "tag_id", "tags">];
      };
      programs: {
        Row: { id: string; title: string; slug: string; host: string | null; description: string | null; poster_url: string | null; language_code: string; is_active: boolean; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; title: string; slug: string; host?: string | null; description?: string | null; poster_url?: string | null; language_code?: string; is_active?: boolean; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["programs"]["Insert"]>;
        Relationships: [Relationship<"programs_created_by_fkey", "created_by", "profiles">];
      };
      program_schedule: {
        Row: { id: string; program_id: string; day_of_week: number; starts_at: string; ends_at: string; timezone: string; is_active: boolean; created_at: string };
        Insert: { id?: string; program_id: string; day_of_week: number; starts_at: string; ends_at: string; timezone?: string; is_active?: boolean; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["program_schedule"]["Insert"]>;
        Relationships: [Relationship<"program_schedule_program_id_fkey", "program_id", "programs">];
      };
      live_streams: {
        Row: { id: string; title: string; embed_url: string | null; hls_url: string | null; status: "live" | "offline" | "scheduled"; scheduled_at: string | null; program_id: string | null; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; title: string; embed_url?: string | null; hls_url?: string | null; status?: "live" | "offline" | "scheduled"; scheduled_at?: string | null; program_id?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["live_streams"]["Insert"]>;
        Relationships: [Relationship<"live_streams_program_id_fkey", "program_id", "programs">, Relationship<"live_streams_created_by_fkey", "created_by", "profiles">];
      };
      radio_streams: {
        Row: { id: string; title: string; stream_url: string; status: "live" | "offline"; description: string | null; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; title: string; stream_url: string; status?: "live" | "offline"; description?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["radio_streams"]["Insert"]>;
        Relationships: [Relationship<"radio_streams_created_by_fkey", "created_by", "profiles">];
      };
      podcast_shows: {
        Row: { id: string; title: string; slug: string; description: string | null; artwork_url: string | null; language_code: string; author_name: string; category: string; is_active: boolean; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; title: string; slug: string; description?: string | null; artwork_url?: string | null; language_code?: string; author_name?: string; category?: string; is_active?: boolean; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["podcast_shows"]["Insert"]>;
        Relationships: [Relationship<"podcast_shows_created_by_fkey", "created_by", "profiles">];
      };
      podcast_episodes: {
        Row: { id: string; show_id: string; title: string; slug: string; summary: string | null; audio_url: string; episode_number: number | null; duration_seconds: number | null; language_code: string; status: ArticleStatus; published_at: string | null; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; show_id: string; title: string; slug: string; summary?: string | null; audio_url: string; episode_number?: number | null; duration_seconds?: number | null; language_code?: string; status?: ArticleStatus; published_at?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["podcast_episodes"]["Insert"]>;
        Relationships: [Relationship<"podcast_episodes_show_id_fkey", "show_id", "podcast_shows">, Relationship<"podcast_episodes_created_by_fkey", "created_by", "profiles">];
      };
      newsletter_subscribers: {
        Row: { id: string; email: string; language_code: string; status: "pending" | "active" | "unsubscribed"; confirmation_token_hash: string | null; unsubscribe_token_hash: string; consented_at: string; confirmed_at: string | null; unsubscribed_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; email: string; language_code?: string; status?: "pending" | "active" | "unsubscribed"; confirmation_token_hash?: string | null; unsubscribe_token_hash: string; consented_at?: string; confirmed_at?: string | null; unsubscribed_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Insert"]>;
        Relationships: [];
      };
      newsletter_campaigns: {
        Row: { id: string; subject: string; preheader: string | null; body: string; language_code: string; status: "draft" | "sending" | "sent" | "failed"; recipient_count: number; sent_at: string | null; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; subject: string; preheader?: string | null; body: string; language_code?: string; status?: "draft" | "sending" | "sent" | "failed"; recipient_count?: number; sent_at?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["newsletter_campaigns"]["Insert"]>;
        Relationships: [Relationship<"newsletter_campaigns_created_by_fkey", "created_by", "profiles">];
      };
      web_push_subscriptions: {
        Row: { id: string; endpoint: string; subscription: Json; language_code: string; created_at: string; updated_at: string };
        Insert: { id?: string; endpoint: string; subscription: Json; language_code?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["web_push_subscriptions"]["Insert"]>;
        Relationships: [];
      };
      ad_campaigns: {
        Row: { id: string; advertiser: string; title: string; description: string | null; image_url: string; destination_url: string; slot: "homepage_top" | "homepage_sidebar" | "article_inline" | "podcast_sidebar"; status: "draft" | "scheduled" | "active" | "paused" | "ended"; starts_at: string | null; ends_at: string | null; sponsored_article_id: string | null; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; advertiser: string; title: string; description?: string | null; image_url: string; destination_url: string; slot: "homepage_top" | "homepage_sidebar" | "article_inline" | "podcast_sidebar"; status?: "draft" | "scheduled" | "active" | "paused" | "ended"; starts_at?: string | null; ends_at?: string | null; sponsored_article_id?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["ad_campaigns"]["Insert"]>;
        Relationships: [Relationship<"ad_campaigns_sponsored_article_id_fkey", "sponsored_article_id", "articles">, Relationship<"ad_campaigns_created_by_fkey", "created_by", "profiles">];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_update_staff_profile: { Args: { target_id: string; new_display_name: string; new_role: NewsroomRole; new_is_active: boolean }; Returns: undefined };
      confirm_newsletter_subscription: { Args: { p_token_hash: string }; Returns: boolean };
      unsubscribe_newsletter: { Args: { p_token_hash: string }; Returns: boolean };
      save_web_push_subscription: { Args: { p_endpoint: string; p_subscription: Json; p_language: string }; Returns: string };
      remove_web_push_subscription: { Args: { p_endpoint: string }; Returns: boolean };
      record_article_view: { Args: { p_article_id: string; p_viewer_key: string }; Returns: undefined };
      toggle_article_like: { Args: { p_article_id: string; p_viewer_key: string }; Returns: { liked: boolean; like_count: number }[] };
      get_public_article_engagement: { Args: { p_article_id: string; p_viewer_key: string }; Returns: { views: number; likes: number; comments: number; liked: boolean }[] };
      submit_article_comment: { Args: { p_article_id: string; p_viewer_key: string; p_commenter_name: string; p_comment_body: string }; Returns: string };
      admin_article_engagement: { Args: Record<PropertyKey, never>; Returns: { article_id: string; views: number; likes: number; pending_comments: number; approved_comments: number }[] };
    };
    Enums: { newsroom_role: NewsroomRole; article_status: ArticleStatus; video_status: ArticleStatus; media_kind: "image" | "video" | "audio" | "document" };
    CompositeTypes: Record<string, never>;
  };
};
