import { readdir, stat } from "node:fs/promises";
import path from "node:path";

export type DiscoveredGame = {
  title: string;
  executablePath: string;
};

const ignoredDirectories = new Set([".git", "node_modules", "dist", "release"]);
const windowsExecutableExtensions = new Set([".bat", ".cmd", ".exe"]);
const maxResults = 500;

export async function scanForGames(rootDirectory: string): Promise<DiscoveredGame[]> {
  const games: DiscoveredGame[] = [];
  await scanDirectory(rootDirectory, games);
  return games;
}

async function scanDirectory(directory: string, games: DiscoveredGame[]): Promise<void> {
  if (games.length >= maxResults) return;

  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (games.length >= maxResults || entry.isSymbolicLink()) continue;

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.endsWith(".app")) {
        games.push({ title: toGameTitle(entry.name), executablePath: entryPath });
      } else if (!ignoredDirectories.has(entry.name) && !entry.name.startsWith(".")) {
        await scanDirectory(entryPath, games);
      }
      continue;
    }

    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    const fileStats = await stat(entryPath);
    const isExecutable = windowsExecutableExtensions.has(extension) || (fileStats.mode & 0o111) !== 0;
    if (isExecutable) games.push({ title: toGameTitle(entry.name), executablePath: entryPath });
  }
}

function toGameTitle(fileName: string): string {
  return path.basename(fileName, path.extname(fileName)).replace(/[._-]+/g, " ").trim();
}
