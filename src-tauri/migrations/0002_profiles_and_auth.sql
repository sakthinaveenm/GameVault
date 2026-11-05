-- 0002_profiles_and_auth.sql
-- Add profile authentication, preferences, cloud links, and device metadata

ALTER TABLE user_profiles ADD COLUMN authentication_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN auth_type TEXT NOT NULL DEFAULT 'none'; -- 'none', 'pin', 'password'
ALTER TABLE user_profiles ADD COLUMN pin_hash TEXT;
ALTER TABLE user_profiles ADD COLUMN pin_salt TEXT;
ALTER TABLE user_profiles ADD COLUMN password_hash TEXT;
ALTER TABLE user_profiles ADD COLUMN password_salt TEXT;
ALTER TABLE user_profiles ADD COLUMN theme_preference TEXT NOT NULL DEFAULT 'dark';
ALTER TABLE user_profiles ADD COLUMN preferred_controller TEXT;
ALTER TABLE user_profiles ADD COLUMN sync_profile_id TEXT;
ALTER TABLE user_profiles ADD COLUMN last_played_game TEXT;

-- Profile Cloud Links table for Google Account association
CREATE TABLE IF NOT EXISTS profile_cloud_links (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    sync_profile_id TEXT NOT NULL,
    google_account_id TEXT NOT NULL,
    google_email TEXT NOT NULL,
    linked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sync_enabled INTEGER NOT NULL DEFAULT 1,
    last_sync_at DATETIME,
    UNIQUE(profile_id, google_account_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_cloud_links_profile ON profile_cloud_links(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_cloud_links_sync_id ON profile_cloud_links(sync_profile_id);

