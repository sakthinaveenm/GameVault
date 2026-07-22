import { readdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export type ScannedPlatformGame = {
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
};

// Find existing directory from list of potential candidates
async function findExistingDir(paths: string[]): Promise<string | null> {
  for (const p of paths) {
    try {
      await access(p);
      return p;
    } catch {
      // Directory not found, try next candidate
    }
  }
  return null;
}

async function getSteamManifestDir(): Promise<string | null> {
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library/Application Support/Steam/steamapps");
  } else if (process.platform === "win32") {
    const winPaths = [
      "C:\\Program Files (x86)\\Steam\\steamapps",
      "C:\\Program Files\\Steam\\steamapps",
    ];
    return (await findExistingDir(winPaths)) || winPaths[0];
  } else {
    // Linux paths
    const linuxPaths = [
      path.join(os.homedir(), ".steam/steam/steamapps"),
      path.join(os.homedir(), ".local/share/Steam/steamapps"),
      path.join(os.homedir(), ".var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps"),
    ];
    return (await findExistingDir(linuxPaths)) || linuxPaths[0];
  }
}

async function getEpicManifestDir(): Promise<string | null> {
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library/Application Support/Epic/EpicGamesLauncher/Data/Manifests");
  } else if (process.platform === "win32") {
    const programData = process.env.ProgramData || "C:\\ProgramData";
    return path.join(programData, "Epic/EpicGamesLauncher/Data/Manifests");
  }
  return null;
}

// Parser helper for Steam .acf files
function parseAcf(content: string): { name?: string; appid?: string; installdir?: string } {
  const result: any = {};
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/"([^"]+)"\s+"([^"]+)"/);
    if (match) {
      const [_, key, value] = match;
      if (key === "name" || key === "appid" || key === "installdir") {
        result[key] = value;
      }
    }
  }
  return result;
}

export async function scanSteamGames(customSteamDir?: string | null): Promise<ScannedPlatformGame[]> {
  const games: ScannedPlatformGame[] = [];
  let steamDir = customSteamDir || await getSteamManifestDir();
  if (!steamDir) return games;

  if (customSteamDir) {
    const lower = steamDir.toLowerCase();
    if (!lower.endsWith("steamapps") && !lower.endsWith("steamapps/") && !lower.endsWith("steamapps\\")) {
      steamDir = path.join(steamDir, "steamapps");
    }
  }

  try {
    const entries = await readdir(steamDir);
    for (const entry of entries) {
      if (entry.startsWith("appmanifest_") && entry.endsWith(".acf")) {
        const filePath = path.join(steamDir, entry);
        const content = await readFile(filePath, "utf-8");
        const parsed = parseAcf(content);
        if (parsed.appid && parsed.name) {
          games.push({
            title: parsed.name,
            executablePath: `steam://run/${parsed.appid}`,
            platform: "steam",
            platformGameId: parsed.appid,
            coverPath: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${parsed.appid}/library_600x900.jpg`,
            developer: "Steam game",
            publisher: "Valve",
            genres: "Steam",
          });
        }
      }
    }
  } catch (err) {
    console.log("Steam directory not detected, skipping scan.");
  }
  return games;
}

async function fetchSteamCoverUrl(title: string): Promise<string | null> {
  try {
    // Sanitize title to remove enhancements or common edition markers for better search matches
    const cleanTitle = title
      .replace(/\b(enhanced|gold|ultimate|goty|edition|deluxe|complete|remastered)\b/gi, "")
      .trim();

    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(cleanTitle)}&l=english&cc=US`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data: any = await res.json();
    if (data && data.items && data.items.length > 0) {
      // Find the best match, fallback to the first result
      const match = data.items.find(
        (item: any) => item.name.toLowerCase() === title.toLowerCase()
      ) || data.items[0];

      if (match && match.id) {
        return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${match.id}/library_600x900.jpg`;
      }
    }
  } catch (err) {
    console.error(`Failed to fetch Steam cover for "${title}":`, err);
  }
  return null;
}

export async function scanEpicGames(): Promise<ScannedPlatformGame[]> {
  const games: ScannedPlatformGame[] = [];
  const epicDir = await getEpicManifestDir();
  if (!epicDir) return games;

  try {
    const entries = await readdir(epicDir);
    const manifests = entries.filter((entry) => entry.endsWith(".item"));

    const scanPromises = manifests.map(async (entry) => {
      try {
        const filePath = path.join(epicDir, entry);
        const content = await readFile(filePath, "utf-8");
        const parsed = JSON.parse(content);
        if (parsed.AppName && parsed.DisplayName) {
          const coverPath = await fetchSteamCoverUrl(parsed.DisplayName);
          return {
            title: parsed.DisplayName,
            executablePath: `com.epicgames.launcher://apps/${parsed.AppName}?action=launch&silent=true`,
            platform: "epic",
            platformGameId: parsed.AppName,
            developer: parsed.DeveloperName || "Epic Games Launcher",
            publisher: "Epic Games",
            genres: "Epic Games",
            coverPath: coverPath || undefined,
          };
        }
      } catch (err) {
        console.error("Error parsing Epic manifest item:", err);
      }
      return null;
    });

    const results = await Promise.all(scanPromises);
    for (const game of results) {
      if (game) games.push(game);
    }
  } catch (err) {
    console.log("Epic Manifest directory not detected, skipping scan.");
  }
  return games;
}

export async function scanGogGames(): Promise<ScannedPlatformGame[]> {
  // GOG games on Mac are typically standalone app bundles inside Applications/ or Applications/GOG/
  // As a lightweight fallback on GOG Galaxy, we scan GOG galaxy folder receipts or Applications
  // For sandbox demonstration, GOG will also be populated via the mock scan.
  return [];
}

// Highly polished Mock games for Demo/Sandbox platforms mode
export function getMockPlatformGames(): ScannedPlatformGame[] {
  return [
    {
      title: "Portal 2",
      executablePath: "steam://run/620",
      platform: "steam",
      platformGameId: "620",
      developer: "Valve",
      publisher: "Valve",
      genres: "Puzzle, Platformer, Co-op",
      releaseDate: "Apr 19, 2011",
      description: "The Portal 2 Single Player introduces a cast of dynamic new characters, a host of fresh puzzle elements, and a much larger set of devious test chambers. Expand your mind in the world of Aperture Science!",
      coverPath: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/620/library_600x900.jpg",
    },
    {
      title: "Hades",
      executablePath: "steam://run/1145360",
      platform: "steam",
      platformGameId: "1145360",
      developer: "Supergiant Games",
      publisher: "Supergiant Games",
      genres: "Action, Roguelike, Hack & Slash",
      releaseDate: "Sep 17, 2020",
      description: "Defy the god of the dead as you hack and slash out of the Underworld in this rogue-like dungeon crawler from the creators of Bastion and Transistor.",
      coverPath: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1145360/library_600x900.jpg",
    },
    {
      title: "Celeste",
      executablePath: "com.epicgames.launcher://apps/Candy?action=launch&silent=true",
      platform: "epic",
      platformGameId: "Candy",
      developer: "Extremely OK Games",
      publisher: "Extremely OK Games",
      genres: "Platformer, Indie, Hardcore",
      releaseDate: "Jan 25, 2018",
      description: "Help Madeline survive her inner demons on her journey to the top of Celeste Mountain, in this super-tight platformer from the creators of TowerFall.",
      coverPath: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/504230/library_600x900.jpg",
    },
    {
      title: "The Witcher 3: Wild Hunt",
      executablePath: "goggalaxy://openGame/Launch/1495134320",
      platform: "gog",
      platformGameId: "1495134320",
      developer: "CD PROJEKT RED",
      publisher: "CD PROJEKT RED",
      genres: "RPG, Open World, Story Rich",
      releaseDate: "May 18, 2015",
      description: "You are Geralt of Rivia, mercenary monster slayer. Before you stands a war-torn, monster-infested continent you can explore at will. Track down the Child of Prophecy, a living weapon that can alter the shape of the world.",
      coverPath: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/library_600x900.jpg",
    }
  ];
}
