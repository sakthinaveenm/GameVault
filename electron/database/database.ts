import DatabaseDriver from "better-sqlite3";
import { isAbsolute } from "node:path";

export type Game = {
  id: number;
  title: string;
  executablePath: string;
  installedAt: string;
  lastPlayedAt: string | null;
  playtimeSeconds: number;
  isFavorite: boolean;
  description?: string | null;
  coverPath?: string | null;
  developer?: string | null;
  publisher?: string | null;
  genres?: string | null;
  releaseDate?: string | null;
  platform: string;
  platformGameId?: string | null;
  launchArguments?: string | null;
  isHidden?: boolean;
  isCompleted?: boolean;
  showcased?: boolean;
  gameSizeBytes?: number;
  preLaunchScript?: string | null;
  postCloseScript?: string | null;
};

export type Profile = {
  id: number;
  displayName: string;
  avatarPath: string | null;
  theme: string;
  accentColor: string;
  startInFullscreen: boolean;
  libraryDirectory?: string | null;
  steamDirectory?: string | null;
  customBgPrimary?: string;
  customBgSecondary?: string;
  customTextPrimary?: string;
  customAccent?: string;
  cloudEmail?: string | null;
  lastSyncAt?: string | null;
  portableMode?: boolean;
  deckModeEnabled?: boolean;
};

export type GameImport = Pick<Game, "title" | "executablePath">;

export type Collection = {
  id: number;
  name: string;
  gameCount: number;
  isFavorite: boolean;
  rules?: string | null;
};

const migrations = [
  {
    version: 1,
    name: "create_games_table",
    up: `
      CREATE TABLE games (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        executable_path TEXT NOT NULL UNIQUE,
        installed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_played_at TEXT,
        playtime_seconds INTEGER NOT NULL DEFAULT 0 CHECK (playtime_seconds >= 0),
        is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1))
      );
      CREATE INDEX idx_games_title ON games(title COLLATE NOCASE);
      CREATE INDEX idx_games_last_played ON games(last_played_at DESC);
    `,
  },
  {
    version: 2,
    name: "add_game_metadata_fields",
    up: `
      ALTER TABLE games ADD COLUMN description TEXT;
      ALTER TABLE games ADD COLUMN cover_path TEXT;
      ALTER TABLE games ADD COLUMN developer TEXT;
      ALTER TABLE games ADD COLUMN publisher TEXT;
      ALTER TABLE games ADD COLUMN genres TEXT;
      ALTER TABLE games ADD COLUMN release_date TEXT;
    `,
  },
  {
    version: 3,
    name: "create_collections",
    up: `
      CREATE TABLE collections (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE collection_games (
        collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        PRIMARY KEY (collection_id, game_id)
      );
      CREATE INDEX idx_collection_games_game ON collection_games(game_id);
    `,
  },
  {
    version: 4,
    name: "create_profiles_and_settings",
    up: `
      CREATE TABLE profiles (
        id INTEGER PRIMARY KEY,
        display_name TEXT NOT NULL DEFAULT 'Player 1',
        avatar_path TEXT,
        theme TEXT NOT NULL DEFAULT 'dark',
        accent_color TEXT NOT NULL DEFAULT 'lime',
        start_in_fullscreen INTEGER NOT NULL DEFAULT 0 CHECK (start_in_fullscreen IN (0, 1)),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO profiles (id, display_name) VALUES (1, 'Player 1');
    `,
  },
  {
    version: 5,
    name: "add_platform_fields",
    up: `
      ALTER TABLE games ADD COLUMN platform TEXT NOT NULL DEFAULT 'local';
      ALTER TABLE games ADD COLUMN platform_game_id TEXT;
    `,
  },
  {
    version: 6,
    name: "add_library_directory",
    up: `
      ALTER TABLE profiles ADD COLUMN library_directory TEXT;
    `,
  },
  {
    version: 7,
    name: "add_custom_theme_colors",
    up: `
      ALTER TABLE profiles ADD COLUMN custom_bg_primary TEXT NOT NULL DEFAULT '#09090b';
      ALTER TABLE profiles ADD COLUMN custom_bg_secondary TEXT NOT NULL DEFAULT '#18181b';
      ALTER TABLE profiles ADD COLUMN custom_text_primary TEXT NOT NULL DEFAULT '#f4f4f5';
      ALTER TABLE profiles ADD COLUMN custom_accent TEXT NOT NULL DEFAULT '#a3e635';
    `,
  },
  {
    version: 8,
    name: "add_steam_directory",
    up: `
      ALTER TABLE profiles ADD COLUMN steam_directory TEXT;
    `,
  },
  {
    version: 9,
    name: "add_v1_1_columns_and_tables",
    up: `
      ALTER TABLE games ADD COLUMN launch_arguments TEXT;
      ALTER TABLE games ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0 CHECK (is_hidden IN (0, 1));
      ALTER TABLE collections ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1));
      ALTER TABLE collections ADD COLUMN rules TEXT;
      CREATE TABLE game_launches (
        id INTEGER PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        launched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        duration_seconds INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX idx_game_launches_game ON game_launches(game_id);
    `,
  },
  {
    version: 10,
    name: "add_v1_2_performance_indices",
    up: `
      CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform);
      CREATE INDEX IF NOT EXISTS idx_games_is_favorite ON games(is_favorite);
      CREATE INDEX IF NOT EXISTS idx_games_is_hidden ON games(is_hidden);
      CREATE INDEX IF NOT EXISTS idx_games_playtime ON games(playtime_seconds);
    `,
  },
  {
    version: 11,
    name: "add_v1_3_emulators_table",
    up: `
      CREATE TABLE IF NOT EXISTS emulators (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        executable_path TEXT NOT NULL,
        platform TEXT NOT NULL,
        default_arguments TEXT
      );
    `,
  },
  {
    version: 12,
    name: "add_v1_4_social_and_achievements",
    up: `
      ALTER TABLE games ADD COLUMN is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1));
      ALTER TABLE games ADD COLUMN showcased INTEGER NOT NULL DEFAULT 0 CHECK (showcased IN (0, 1));
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        icon_path TEXT,
        unlocked INTEGER NOT NULL DEFAULT 0 CHECK (unlocked IN (0, 1)),
        unlocked_at TEXT,
        showcased INTEGER NOT NULL DEFAULT 0 CHECK (showcased IN (0, 1))
      );
      CREATE INDEX IF NOT EXISTS idx_achievements_game ON achievements(game_id);
    `,
  },
  {
    version: 13,
    name: "add_v1_5_plugins_table",
    up: `
      CREATE TABLE IF NOT EXISTS plugins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        author TEXT NOT NULL,
        version TEXT NOT NULL,
        type TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
        config TEXT,
        code TEXT
      );
      INSERT OR IGNORE INTO plugins (id, name, description, author, version, type, enabled, config, code)
      VALUES 
        ('discord-rpc', 'Discord Rich Presence', 'Displays active game playtime details onto your Discord status.', 'GameVault Core', '1.0.0', 'integration', 0, '{}', ''),
        ('cyberpunk-neon', 'Cyberpunk Neon Theme', 'Injects a dynamic dark neon cyberpunk green/pink color palette to GameVault.', 'NeoStyles', '1.2.0', 'theme', 0, '{"primary":"#050508","secondary":"#0f0a1c","accent":"#ff0055","accentHover":"#ff3377","text":"#00ffcc"}', '');
    `,
  },
  {
    version: 14,
    name: "add_v2_0_gamevault_hub",
    up: `
      ALTER TABLE games ADD COLUMN game_size_bytes INTEGER NOT NULL DEFAULT 15000000000;
      ALTER TABLE games ADD COLUMN pre_launch_script TEXT;
      ALTER TABLE games ADD COLUMN post_close_script TEXT;
      ALTER TABLE profiles ADD COLUMN cloud_email TEXT;
      ALTER TABLE profiles ADD COLUMN last_sync_at TEXT;
    `,
  },
  {
    version: 15,
    name: "add_future_vision_columns",
    up: `
      ALTER TABLE profiles ADD COLUMN portable_mode INTEGER NOT NULL DEFAULT 0 CHECK (portable_mode IN (0, 1));
      ALTER TABLE profiles ADD COLUMN deck_mode_enabled INTEGER NOT NULL DEFAULT 0 CHECK (deck_mode_enabled IN (0, 1));
    `,
  },
] as const;

export class Database {
  private constructor(private readonly connection: DatabaseDriver.Database) {}

  static open(filePath: string): Database {
    const connection = new DatabaseDriver(filePath);
    connection.pragma("foreign_keys = ON");
    connection.pragma("journal_mode = WAL");
    connection.pragma("synchronous = NORMAL");
    connection.pragma("busy_timeout = 5000");

    const database = new Database(connection);
    database.runMigrations();
    return database;
  }

  isReady(): boolean {
    return this.connection.open;
  }

  close(): void {
    this.connection.close();
  }

  importGames(games: GameImport[]): number {
    const uniqueGames = [...new Map(games.map((game) => [game.executablePath, game])).values()];
    if (uniqueGames.length === 0) return 0;

    for (const game of uniqueGames) {
      if (!game.title.trim() || !isAbsolute(game.executablePath)) {
        throw new Error("Invalid game import.");
      }
    }

    const upsertGame = this.connection.prepare(`
      INSERT INTO games (title, executable_path)
      VALUES (?, ?)
      ON CONFLICT(executable_path) DO UPDATE SET title = excluded.title
    `);
    const importAll = this.connection.transaction((entries: GameImport[]) => {
      for (const game of entries) upsertGame.run(game.title.trim(), game.executablePath);
    });

    importAll(uniqueGames);
    return uniqueGames.length;
  }

  getGames(): Game[] {
    const rows = this.connection.prepare(`
      SELECT id, title, executable_path, installed_at, last_played_at, playtime_seconds, is_favorite, description, cover_path, developer, publisher, genres, release_date, platform, platform_game_id, launch_arguments, is_hidden, is_completed, showcased, game_size_bytes, pre_launch_script, post_close_script
      FROM games
      ORDER BY title COLLATE NOCASE ASC
    `).all() as Array<{
      id: number;
      title: string;
      executable_path: string;
      installed_at: string;
      last_played_at: string | null;
      playtime_seconds: number;
      is_favorite: number;
      description: string | null;
      cover_path: string | null;
      developer: string | null;
      publisher: string | null;
      genres: string | null;
      release_date: string | null;
      platform: string;
      platform_game_id: string | null;
      launch_arguments: string | null;
      is_hidden: number;
      is_completed: number;
      showcased: number;
      game_size_bytes: number;
      pre_launch_script: string | null;
      post_close_script: string | null;
    }>;

    return rows.map((game) => ({
      id: game.id,
      title: game.title,
      executablePath: game.executable_path,
      installedAt: game.installed_at,
      lastPlayedAt: game.last_played_at,
      playtimeSeconds: game.playtime_seconds,
      isFavorite: game.is_favorite === 1,
      description: game.description,
      coverPath: game.cover_path,
      developer: game.developer,
      publisher: game.publisher,
      genres: game.genres,
      releaseDate: game.release_date,
      platform: game.platform,
      platformGameId: game.platform_game_id,
      launchArguments: game.launch_arguments,
      isHidden: game.is_hidden === 1,
      isCompleted: game.is_completed === 1,
      showcased: game.showcased === 1,
      gameSizeBytes: game.game_size_bytes,
      preLaunchScript: game.pre_launch_script,
      postCloseScript: game.post_close_script,
    }));
  }

  importPlatformGames(games: Array<{
    title: string;
    executablePath: string;
    platform: string;
    platformGameId: string;
    description?: string;
    coverPath?: string;
    developer?: string;
    publisher?: string;
    genres?: string;
    releaseDate?: string;
  }>): number {
    if (games.length === 0) return 0;
    const upsertGame = this.connection.prepare(`
      INSERT INTO games (title, executable_path, platform, platform_game_id, description, cover_path, developer, publisher, genres, release_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(executable_path) DO UPDATE SET
        title = excluded.title,
        platform = excluded.platform,
        platform_game_id = excluded.platform_game_id,
        description = COALESCE(excluded.description, description),
        cover_path = COALESCE(excluded.cover_path, cover_path),
        developer = COALESCE(excluded.developer, developer),
        publisher = COALESCE(excluded.publisher, publisher),
        genres = COALESCE(excluded.genres, genres),
        release_date = COALESCE(excluded.release_date, release_date)
    `);
    const importAll = this.connection.transaction((entries: any[]) => {
      for (const game of entries) {
        upsertGame.run(
          game.title.trim(),
          game.executablePath,
          game.platform,
          game.platformGameId,
          game.description || null,
          game.coverPath || null,
          game.developer || null,
          game.publisher || null,
          game.genres || null,
          game.releaseDate || null
        );
        const row = this.connection.prepare("SELECT id FROM games WHERE executable_path = ?").get(game.executablePath) as { id: number };
        if (row) {
          this.seedMockAchievements(row.id);
        }
      }
    });
    importAll(games);
    return games.length;
  }

  clearPlatformGames(): void {
    this.connection.prepare("DELETE FROM games WHERE platform != 'local'").run();
  }

  setGameFavorite(gameId: number, isFavorite: boolean): void {
    if (!Number.isSafeInteger(gameId) || gameId < 1) throw new Error("Invalid game.");
    this.connection.prepare("UPDATE games SET is_favorite = ? WHERE id = ?").run(isFavorite ? 1 : 0, gameId);
  }

  getCollections(): Collection[] {
    const rows = this.connection.prepare(`
      SELECT collections.id, collections.name, collections.is_favorite, collections.rules, COUNT(collection_games.game_id) AS game_count
      FROM collections
      LEFT JOIN collection_games ON collection_games.collection_id = collections.id
      GROUP BY collections.id
      ORDER BY collections.name COLLATE NOCASE ASC
    `).all() as Array<{ id: number; name: string; is_favorite: number; rules: string | null; game_count: number }>;

    return rows.map((collection) => ({
      id: collection.id,
      name: collection.name,
      gameCount: collection.game_count,
      isFavorite: collection.is_favorite === 1,
      rules: collection.rules,
    }));
  }

  createCollection(name: string): Collection {
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 60) throw new Error("Collection names must be 1–60 characters.");

    const result = this.connection.prepare("INSERT INTO collections (name) VALUES (?)").run(trimmedName);
    return { id: Number(result.lastInsertRowid), name: trimmedName, gameCount: 0, isFavorite: false };
  }

  getProfile(): Profile {
    const row = this.connection.prepare("SELECT * FROM profiles WHERE id = 1").get() as {
      id: number;
      display_name: string;
      avatar_path: string | null;
      theme: string;
      accent_color: string;
      start_in_fullscreen: number;
      library_directory: string | null;
      steam_directory: string | null;
      custom_bg_primary: string;
      custom_bg_secondary: string;
      custom_text_primary: string;
      custom_accent: string;
      cloud_email: string | null;
      last_sync_at: string | null;
      portable_mode: number;
      deck_mode_enabled: number;
    };
    return {
      id: row.id,
      displayName: row.display_name,
      avatarPath: row.avatar_path,
      theme: row.theme,
      accentColor: row.accent_color,
      startInFullscreen: row.start_in_fullscreen === 1,
      libraryDirectory: row.library_directory,
      steamDirectory: row.steam_directory,
      customBgPrimary: row.custom_bg_primary,
      customBgSecondary: row.custom_bg_secondary,
      customTextPrimary: row.custom_text_primary,
      customAccent: row.custom_accent,
      cloudEmail: row.cloud_email,
      lastSyncAt: row.last_sync_at,
      portableMode: row.portable_mode === 1,
      deckModeEnabled: row.deck_mode_enabled === 1,
    };
  }

  updateProfile(name: string, avatarPath: string | null): void {
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 50) throw new Error("Name must be 1–50 characters.");
    this.connection.prepare("UPDATE profiles SET display_name = ?, avatar_path = ? WHERE id = 1").run(trimmedName, avatarPath);
  }

  updateSettings(
    theme: string,
    accentColor: string,
    startInFullscreen: boolean,
    libraryDirectory: string | null,
    steamDirectory: string | null,
    customBgPrimary?: string,
    customBgSecondary?: string,
    customTextPrimary?: string,
    customAccent?: string
  ): void {
    this.connection.prepare(`
      UPDATE profiles SET
        theme = ?,
        accent_color = ?,
        start_in_fullscreen = ?,
        library_directory = ?,
        steam_directory = ?,
        custom_bg_primary = COALESCE(?, custom_bg_primary),
        custom_bg_secondary = COALESCE(?, custom_bg_secondary),
        custom_text_primary = COALESCE(?, custom_text_primary),
        custom_accent = COALESCE(?, custom_accent)
      WHERE id = 1
    `).run(
      theme,
      accentColor,
      startInFullscreen ? 1 : 0,
      libraryDirectory,
      steamDirectory,
      customBgPrimary || null,
      customBgSecondary || null,
      customTextPrimary || null,
      customAccent || null
    );
  }

  recordGameStart(gameId: number): void {
    this.connection.prepare("UPDATE games SET last_played_at = datetime('now', 'localtime') WHERE id = ?").run(gameId);
    this.connection.prepare(`
      UPDATE achievements 
      SET unlocked = 1, unlocked_at = datetime('now', 'localtime') 
      WHERE game_id = ? AND title = 'First Blood' AND unlocked = 0
    `).run(gameId);
  }

  incrementPlaytime(gameId: number, seconds: number): void {
    if (seconds < 0) return;
    this.connection.prepare("UPDATE games SET playtime_seconds = playtime_seconds + ? WHERE id = ?").run(seconds, gameId);
    
    const game = this.connection.prepare("SELECT playtime_seconds FROM games WHERE id = ?").get(gameId) as { playtime_seconds: number };
    if (game && game.playtime_seconds >= 3600) {
      this.connection.prepare(`
        UPDATE achievements 
        SET unlocked = 1, unlocked_at = datetime('now', 'localtime') 
        WHERE game_id = ? AND title = 'Veteran Player' AND unlocked = 0
      `).run(gameId);
    }
  }

  addGame(
    title: string,
    executablePath: string,
    platform: string = "local",
    metadata: {
      description?: string | null;
      coverPath?: string | null;
      developer?: string | null;
      publisher?: string | null;
      genres?: string | null;
      releaseDate?: string | null;
      launchArguments?: string | null;
      platformGameId?: string | null;
    } = {}
  ): number {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) throw new Error("Game title is required.");

    const result = this.connection.prepare(`
      INSERT INTO games (title, executable_path, platform, description, cover_path, developer, publisher, genres, release_date, launch_arguments, platform_game_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      trimmedTitle,
      executablePath,
      platform,
      metadata.description || null,
      metadata.coverPath || null,
      metadata.developer || null,
      metadata.publisher || null,
      metadata.genres || null,
      metadata.releaseDate || null,
      metadata.launchArguments || null,
      metadata.platformGameId || null
    );

    const gameId = Number(result.lastInsertRowid);
    this.seedMockAchievements(gameId);
    return gameId;
  }

  deleteGame(gameId: number): void {
    if (!Number.isSafeInteger(gameId) || gameId < 1) throw new Error("Invalid game ID.");
    this.connection.prepare("DELETE FROM games WHERE id = ?").run(gameId);
  }

  setGameHidden(gameId: number, isHidden: boolean): void {
    if (!Number.isSafeInteger(gameId) || gameId < 1) throw new Error("Invalid game ID.");
    this.connection.prepare("UPDATE games SET is_hidden = ? WHERE id = ?").run(isHidden ? 1 : 0, gameId);
  }

  setCollectionFavorite(collectionId: number, isFavorite: boolean): void {
    if (!Number.isSafeInteger(collectionId) || collectionId < 1) throw new Error("Invalid collection ID.");
    this.connection.prepare("UPDATE collections SET is_favorite = ? WHERE id = ?").run(isFavorite ? 1 : 0, collectionId);
  }

  getLaunchHistory(gameId: number): Array<{ id: number; gameId: number; launchedAt: string; durationSeconds: number }> {
    const rows = this.connection.prepare(`
      SELECT id, game_id, launched_at, duration_seconds
      FROM game_launches
      WHERE game_id = ?
      ORDER BY launched_at DESC
    `).all(gameId) as Array<{
      id: number;
      game_id: number;
      launched_at: string;
      duration_seconds: number;
    }>;

    return rows.map((row) => ({
      id: row.id,
      gameId: row.game_id,
      launchedAt: row.launched_at,
      durationSeconds: row.duration_seconds,
    }));
  }

  recordLaunchSession(gameId: number, durationSeconds: number): void {
    if (!Number.isSafeInteger(gameId) || gameId < 1) throw new Error("Invalid game ID.");
    if (durationSeconds < 0) return;
    this.connection.prepare(`
      INSERT INTO game_launches (game_id, duration_seconds, launched_at)
      VALUES (?, ?, datetime('now', 'localtime'))
    `).run(gameId, durationSeconds);
  }

  updateCollectionRules(collectionId: number, rules: string | null): void {
    if (!Number.isSafeInteger(collectionId) || collectionId < 1) throw new Error("Invalid collection ID.");
    this.connection.prepare("UPDATE collections SET rules = ? WHERE id = ?").run(rules, collectionId);
  }

  updateGameMetadata(gameId: number, metadata: {
    title?: string;
    executablePath?: string;
    description?: string | null;
    coverPath?: string | null;
    developer?: string | null;
    publisher?: string | null;
    genres?: string | null;
    releaseDate?: string | null;
    launchArguments?: string | null;
    isHidden?: boolean;
  }): void {
    const current = this.connection.prepare(
      "SELECT title, executable_path, description, cover_path, developer, publisher, genres, release_date, launch_arguments, is_hidden FROM games WHERE id = ?"
    ).get(gameId) as any;
    if (!current) throw new Error("Game not found.");

    this.connection.prepare(`
      UPDATE games SET
        title = ?,
        executable_path = ?,
        description = ?,
        cover_path = ?,
        developer = ?,
        publisher = ?,
        genres = ?,
        release_date = ?,
        launch_arguments = ?,
        is_hidden = ?
      WHERE id = ?
    `).run(
      metadata.title !== undefined ? metadata.title : current.title,
      metadata.executablePath !== undefined ? metadata.executablePath : current.executable_path,
      metadata.description !== undefined ? metadata.description : current.description,
      metadata.coverPath !== undefined ? metadata.coverPath : current.cover_path,
      metadata.developer !== undefined ? metadata.developer : current.developer,
      metadata.publisher !== undefined ? metadata.publisher : current.publisher,
      metadata.genres !== undefined ? metadata.genres : current.genres,
      metadata.releaseDate !== undefined ? metadata.releaseDate : current.release_date,
      metadata.launchArguments !== undefined ? metadata.launchArguments : current.launch_arguments,
      metadata.isHidden !== undefined ? (metadata.isHidden ? 1 : 0) : current.is_hidden,
      gameId
    );
  }

  addGameToCollection(collectionId: number, gameId: number): void {
    this.connection.prepare("INSERT OR IGNORE INTO collection_games (collection_id, game_id) VALUES (?, ?)").run(collectionId, gameId);
  }

  removeGameFromCollection(collectionId: number, gameId: number): void {
    this.connection.prepare("DELETE FROM collection_games WHERE collection_id = ? AND game_id = ?").run(collectionId, gameId);
  }

  getCollectionGames(collectionId: number): number[] {
    const rows = this.connection.prepare("SELECT game_id FROM collection_games WHERE collection_id = ?").all(collectionId) as Array<{ game_id: number }>;
    return rows.map((r) => r.game_id);
  }

  addEmulator(name: string, executablePath: string, platform: string, defaultArguments: string): number {
    const result = this.connection.prepare(`
      INSERT INTO emulators (name, executable_path, platform, default_arguments)
      VALUES (?, ?, ?, ?)
    `).run(name, executablePath, platform, defaultArguments);
    return Number(result.lastInsertRowid);
  }

  deleteEmulator(emulatorId: number): void {
    this.connection.prepare("DELETE FROM emulators WHERE id = ?").run(emulatorId);
    this.connection.prepare("DELETE FROM games WHERE platform = 'emulator' AND platform_game_id = ?").run(String(emulatorId));
  }

  getEmulators(): Array<{ id: number; name: string; executablePath: string; platform: string; defaultArguments: string }> {
    const rows = this.connection.prepare("SELECT id, name, executable_path, platform, default_arguments FROM emulators").all() as Array<{
      id: number;
      name: string;
      executable_path: string;
      platform: string;
      default_arguments: string;
    }>;
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      executablePath: row.executable_path,
      platform: row.platform,
      defaultArguments: row.default_arguments,
    }));
  }

  seedMockAchievements(gameId: number): void {
    const check = this.connection.prepare("SELECT COUNT(*) as count FROM achievements WHERE game_id = ?").get(gameId) as { count: number };
    if (check.count > 0) return;

    this.connection.prepare(`
      INSERT INTO achievements (game_id, title, description, icon_path)
      VALUES 
        (?, 'First Blood', 'Launch this game for the first time.', 'trophy-first-play'),
        (?, 'Veteran Player', 'Accumulate 1 hour of playtime.', 'trophy-veteran'),
        (?, 'Perfectionist', 'Complete the main campaign story.', 'trophy-completionist')
    `).run(gameId, gameId, gameId);
  }

  getAchievements(gameId?: number): Array<{ id: number; gameId: number; title: string; description: string; unlocked: boolean; unlockedAt: string | null; showcased: boolean }> {
    let rows;
    if (gameId !== undefined) {
      rows = this.connection.prepare("SELECT id, game_id, title, description, unlocked, unlocked_at, showcased FROM achievements WHERE game_id = ?").all(gameId);
    } else {
      rows = this.connection.prepare("SELECT id, game_id, title, description, unlocked, unlocked_at, showcased FROM achievements").all();
    }
    return (rows as any[]).map((row) => ({
      id: row.id,
      gameId: row.game_id,
      title: row.title,
      description: row.description,
      unlocked: row.unlocked === 1,
      unlockedAt: row.unlocked_at,
      showcased: row.showcased === 1,
    }));
  }

  setAchievementShowcased(id: number, showcased: boolean): void {
    this.connection.prepare("UPDATE achievements SET showcased = ? WHERE id = ?").run(showcased ? 1 : 0, id);
  }

  setGameShowcased(id: number, showcased: boolean): void {
    this.connection.prepare("UPDATE games SET showcased = ? WHERE id = ?").run(showcased ? 1 : 0, id);
  }

  setGameCompleted(id: number, completed: boolean): void {
    this.connection.prepare("UPDATE games SET is_completed = ? WHERE id = ?").run(completed ? 1 : 0, id);
    if (completed) {
      this.connection.prepare(`
        UPDATE achievements 
        SET unlocked = 1, unlocked_at = datetime('now', 'localtime') 
        WHERE game_id = ? AND title = 'Perfectionist' AND unlocked = 0
      `).run(id);
    } else {
      this.connection.prepare(`
        UPDATE achievements 
        SET unlocked = 0, unlocked_at = NULL 
        WHERE game_id = ? AND title = 'Perfectionist'
      `).run(id);
    }
  }

  getLaunchTimeline(): Array<{ id: number; gameTitle: string; platform: string; coverPath: string | null; launchedAt: string; durationSeconds: number }> {
    const rows = this.connection.prepare(`
      SELECT l.id, g.title as game_title, g.platform, g.cover_path, l.launched_at, l.duration_seconds
      FROM game_launches l
      JOIN games g ON l.game_id = g.id
      ORDER BY l.launched_at DESC
      LIMIT 50
    `).all() as Array<{
      id: number;
      game_title: string;
      platform: string;
      cover_path: string | null;
      launched_at: string;
      duration_seconds: number;
    }>;
    return rows.map((row) => ({
      id: row.id,
      gameTitle: row.game_title,
      platform: row.platform,
      coverPath: row.cover_path,
      launchedAt: row.launched_at,
      durationSeconds: row.duration_seconds,
    }));
  }

  getInstalledPlugins(): Array<{ id: string; name: string; description: string; author: string; version: string; type: string; enabled: boolean; config: string; code: string }> {
    const rows = this.connection.prepare("SELECT id, name, description, author, version, type, enabled, config, code FROM plugins").all() as Array<{
      id: string;
      name: string;
      description: string;
      author: string;
      version: string;
      type: string;
      enabled: number;
      config: string;
      code: string;
    }>;
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      author: row.author,
      version: row.version,
      type: row.type,
      enabled: row.enabled === 1,
      config: row.config,
      code: row.code,
    }));
  }

  installPlugin(id: string, name: string, description: string, author: string, version: string, type: string, config: string, code: string): void {
    this.connection.prepare(`
      INSERT OR REPLACE INTO plugins (id, name, description, author, version, type, enabled, config, code)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(id, name, description, author, version, type, config, code);
  }

  uninstallPlugin(id: string): void {
    this.connection.prepare("DELETE FROM plugins WHERE id = ?").run(id);
  }

  setPluginEnabled(id: string, enabled: boolean): void {
    this.connection.prepare("UPDATE plugins SET enabled = ? WHERE id = ?").run(enabled ? 1 : 0, id);
  }

  updatePluginConfig(id: string, config: string): void {
    this.connection.prepare("UPDATE plugins SET config = ? WHERE id = ?").run(config, id);
  }

  updateCloudAccount(email: string | null, lastSyncAt: string | null): void {
    this.connection.prepare("UPDATE profiles SET cloud_email = ?, last_sync_at = ? WHERE id = 1").run(email, lastSyncAt);
  }

  updateGameScripts(gameId: number, preLaunch: string | null, postClose: string | null): void {
    this.connection.prepare("UPDATE games SET pre_launch_script = ?, post_close_script = ? WHERE id = ?").run(preLaunch, postClose, gameId);
  }

  updatePortableMode(enabled: boolean): void {
    this.connection.prepare("UPDATE profiles SET portable_mode = ? WHERE id = 1").run(enabled ? 1 : 0);
  }

  updateDeckMode(enabled: boolean): void {
    this.connection.prepare("UPDATE profiles SET deck_mode_enabled = ? WHERE id = 1").run(enabled ? 1 : 0);
  }

  private runMigrations(): void {
    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const appliedVersions = new Set(
      (this.connection.prepare("SELECT version FROM schema_migrations").all() as Array<{ version: number }>)
        .map(({ version }) => version),
    );
    const recordMigration = this.connection.prepare(
      "INSERT INTO schema_migrations (version, name) VALUES (?, ?)",
    );

    const applyPendingMigrations = this.connection.transaction(() => {
      for (const migration of migrations) {
        if (appliedVersions.has(migration.version)) continue;
        this.connection.exec(migration.up);
        recordMigration.run(migration.version, migration.name);
      }
    });

    applyPendingMigrations();
  }
}
