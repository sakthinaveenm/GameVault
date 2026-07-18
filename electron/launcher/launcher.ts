import { spawn } from "node:child_process";
import { BrowserWindow } from "electron";
import type { Database } from "../database/database.js";

// Keep track of any currently running game session
let activeSession: {
  gameId: number;
  startTime: number;
  process: ReturnType<typeof spawn>;
} | null = null;

export function getRunningGameId(): number | null {
  return activeSession ? activeSession.gameId : null;
}

export function launchGame(database: Database, gameId: number): void {
  if (activeSession) {
    throw new Error("A game is already running. Please close it first.");
  }

  const game = database.getGames().find((g) => g.id === gameId);
  if (!game) {
    throw new Error("Game not found.");
  }

  // Update last played timestamp immediately
  database.recordGameStart(gameId);

  const isMacApp = process.platform === "darwin" && game.executablePath.endsWith(".app");
  let child;

  if (isMacApp) {
    // On macOS, open -W waits for the app to terminate
    child = spawn("open", ["-W", game.executablePath]);
  } else {
    // Run the executable directly
    child = spawn(game.executablePath, [], {
      detached: true,
      stdio: "ignore",
    });
  }

  const startTime = Date.now();
  activeSession = {
    gameId,
    startTime,
    process: child,
  };

  // Notify UI that the game has started
  sendGameStatus(gameId, "started");

  const onExit = () => {
    if (activeSession && activeSession.gameId === gameId) {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      if (durationSeconds > 0) {
        database.incrementPlaytime(gameId, durationSeconds);
      }
      activeSession = null;
      sendGameStatus(gameId, "stopped", durationSeconds);
    }
  };

  child.on("exit", onExit);
  child.on("error", (err) => {
    console.error("Failed to launch game process:", err);
    if (activeSession && activeSession.gameId === gameId) {
      activeSession = null;
      sendGameStatus(gameId, "error");
    }
  });
}

function sendGameStatus(gameId: number, status: "started" | "stopped" | "error", sessionDuration?: number) {
  const windows = BrowserWindow.getAllWindows();
  for (const window of windows) {
    window.webContents.send("library:game-status", {
      gameId,
      status,
      sessionDuration,
    });
  }
}
