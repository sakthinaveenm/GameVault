import DatabaseDriver from "better-sqlite3";

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
