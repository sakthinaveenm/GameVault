import { readdir, readFile } from "node:fs/promises";
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

// Standard macOS paths for Steam, Epic, and GOG clients
const STEAM_MANIFEST_DIR = path.join(os.homedir(), "Library/Application Support/Steam/steamapps");
const EPIC_MANIFEST_DIR = path.join(os.homedir(), "Library/Application Support/Epic/EpicGamesLauncher/Data/Manifests");

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

export async function scanSteamGames(): Promise<ScannedPlatformGame[]> {
  const games: ScannedPlatformGame[] = [];
  try {
    const entries = await readdir(STEAM_MANIFEST_DIR);
    for (const entry of entries) {
      if (entry.startsWith("appmanifest_") && entry.endsWith(".acf")) {
        const filePath = path.join(STEAM_MANIFEST_DIR, entry);
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
    // If folder doesn't exist, ignore
    console.log("Steam directory not detected, skipping scan.");
  }
  return games;
}

export async function scanEpicGames(): Promise<ScannedPlatformGame[]> {
  const games: ScannedPlatformGame[] = [];
  try {
    const entries = await readdir(EPIC_MANIFEST_DIR);
    for (const entry of entries) {
      if (entry.endsWith(".item")) {
        const filePath = path.join(EPIC_MANIFEST_DIR, entry);
        const content = await readFile(filePath, "utf-8");
        const parsed = JSON.parse(content);
        if (parsed.AppName && parsed.DisplayName) {
          games.push({
            title: parsed.DisplayName,
            executablePath: `com.epicgames.launcher://apps/${parsed.AppName}?action=launch&silent=true`,
            platform: "epic",
            platformGameId: parsed.AppName,
            developer: parsed.DeveloperName || "Epic Games Launcher",
            publisher: "Epic Games",
            genres: "Epic Games",
          });
        }
      }
    }
  } catch (err) {
    // If folder doesn't exist, ignore
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
