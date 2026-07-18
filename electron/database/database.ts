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
};

export type Profile = {
  id: number;
  displayName: string;
  avatarPath: string | null;
  theme: string;
  accentColor: string;
  startInFullscreen: boolean;
  libraryDirectory?: string | null;
};

export type GameImport = Pick<Game, "title" | "executablePath">;

export type Collection = {
  id: number;
  name: string;
  gameCount: number;
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
      SELECT id, title, executable_path, installed_at, last_played_at, playtime_seconds, is_favorite, description, cover_path, developer, publisher, genres, release_date, platform, platform_game_id
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
      SELECT collections.id, collections.name, COUNT(collection_games.game_id) AS game_count
      FROM collections
      LEFT JOIN collection_games ON collection_games.collection_id = collections.id
      GROUP BY collections.id
      ORDER BY collections.name COLLATE NOCASE ASC
    `).all() as Array<{ id: number; name: string; game_count: number }>;

    return rows.map((collection) => ({ id: collection.id, name: collection.name, gameCount: collection.game_count }));
  }

  createCollection(name: string): Collection {
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 60) throw new Error("Collection names must be 1–60 characters.");

    const result = this.connection.prepare("INSERT INTO collections (name) VALUES (?)").run(trimmedName);
    return { id: Number(result.lastInsertRowid), name: trimmedName, gameCount: 0 };
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
    };
    return {
      id: row.id,
      displayName: row.display_name,
      avatarPath: row.avatar_path,
      theme: row.theme,
      accentColor: row.accent_color,
      startInFullscreen: row.start_in_fullscreen === 1,
      libraryDirectory: row.library_directory,
    };
  }

  updateProfile(name: string, avatarPath: string | null): void {
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 50) throw new Error("Name must be 1–50 characters.");
    this.connection.prepare("UPDATE profiles SET display_name = ?, avatar_path = ? WHERE id = 1").run(trimmedName, avatarPath);
  }

  updateSettings(theme: string, accentColor: string, startInFullscreen: boolean, libraryDirectory: string | null): void {
    this.connection.prepare("UPDATE profiles SET theme = ?, accent_color = ?, start_in_fullscreen = ?, library_directory = ? WHERE id = 1")
      .run(theme, accentColor, startInFullscreen ? 1 : 0, libraryDirectory);
  }

  recordGameStart(gameId: number): void {
    this.connection.prepare("UPDATE games SET last_played_at = datetime('now', 'localtime') WHERE id = ?").run(gameId);
  }

  incrementPlaytime(gameId: number, seconds: number): void {
    if (seconds < 0) return;
    this.connection.prepare("UPDATE games SET playtime_seconds = playtime_seconds + ? WHERE id = ?").run(seconds, gameId);
  }

  updateGameMetadata(gameId: number, metadata: {
    description?: string | null;
    coverPath?: string | null;
    developer?: string | null;
    publisher?: string | null;
    genres?: string | null;
    releaseDate?: string | null;
  }): void {
    const current = this.connection.prepare(
      "SELECT description, cover_path, developer, publisher, genres, release_date FROM games WHERE id = ?"
    ).get(gameId) as any;
    if (!current) throw new Error("Game not found.");

    this.connection.prepare(`
      UPDATE games SET
        description = ?,
        cover_path = ?,
        developer = ?,
        publisher = ?,
        genres = ?,
        release_date = ?
      WHERE id = ?
    `).run(
      metadata.description !== undefined ? metadata.description : current.description,
      metadata.coverPath !== undefined ? metadata.coverPath : current.cover_path,
      metadata.developer !== undefined ? metadata.developer : current.developer,
      metadata.publisher !== undefined ? metadata.publisher : current.publisher,
      metadata.genres !== undefined ? metadata.genres : current.genres,
      metadata.releaseDate !== undefined ? metadata.releaseDate : current.release_date,
      gameId
    );
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
