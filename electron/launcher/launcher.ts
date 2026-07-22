import { spawn, exec } from "node:child_process";
import { BrowserWindow, shell } from "electron";
import type { Database } from "../database/database.js";

// Keep track of any currently running game session
let activeSession: {
  gameId: number;
  startTime: number;
  process?: ReturnType<typeof spawn>;
  pollingInterval?: ReturnType<typeof setInterval>;
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

  const startTime = Date.now();

  if (game.platform === "local") {
    const isMacApp = process.platform === "darwin" && game.executablePath.endsWith(".app");
    
    // Parse launch arguments
    const args: string[] = [];
    if (game.launchArguments) {
      const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
      let matches;
      while ((matches = regex.exec(game.launchArguments)) !== null) {
        args.push(matches[1] || matches[2] || matches[3]);
      }
    }

    let child;

    if (isMacApp) {
      // On macOS, open -W waits for the app to terminate
      const openArgs = ["-W", game.executablePath];
      if (args.length > 0) {
        openArgs.push("--args", ...args);
      }
      child = spawn("open", openArgs);
    } else {
      // Run the executable directly
      child = spawn(game.executablePath, args, {
        detached: true,
        stdio: "ignore",
      });
    }

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
          database.recordLaunchSession(gameId, durationSeconds);
        }
        activeSession = null;
        sendGameStatus(gameId, "stopped", durationSeconds);
      }
    };

    child.on("exit", onExit);
    child.on("error", (err) => {
      console.error("Failed to launch local game process:", err);
      if (activeSession && activeSession.gameId === gameId) {
        activeSession = null;
        sendGameStatus(gameId, "error");
      }
    });
  } else {
    // Launch game via Launcher protocol URL (Steam, GOG, Epic)
    shell.openExternal(game.executablePath).catch((err) => {
      console.error("Failed to trigger launcher protocol:", err);
    });

    // Notify UI immediately
    sendGameStatus(gameId, "started");

    // Resolve binary name to poll using pgrep
    let binaryName = game.title;
    const lowerTitle = game.title.toLowerCase();
    if (lowerTitle.includes("portal 2")) binaryName = "portal2";
    else if (lowerTitle.includes("hades")) binaryName = "hades";
    else if (lowerTitle.includes("celeste")) binaryName = "Celeste";
    else if (lowerTitle.includes("witcher 3")) binaryName = "witcher3";

    let hasStarted = false;
    let waitPolls = 0;
    const maxWaitPolls = 12; // 60 seconds timeout waiting for launch

    const pollingInterval = setInterval(() => {
      const isWin = process.platform === "win32";
      const cmd = isWin
        ? `tasklist /NH /FI "IMAGENAME eq ${binaryName.endsWith(".exe") ? binaryName : binaryName + ".exe"}"`
        : `pgrep -f "${binaryName}"`;

      exec(cmd, (err, stdout) => {
        const isRunning = isWin
          ? (!err && stdout.toLowerCase().includes(binaryName.toLowerCase()))
          : (!err && stdout.trim().length > 0);

        if (!hasStarted) {
          waitPolls++;
          if (isRunning) {
            hasStarted = true;
          } else if (waitPolls >= maxWaitPolls) {
            // Game failed to start or exited immediately
            clearInterval(pollingInterval);
            if (activeSession && activeSession.gameId === gameId) {
              activeSession = null;
              sendGameStatus(gameId, "stopped", 0);
            }
          }
        } else {
          // Game has been launched and was running, now closed
          if (!isRunning) {
            clearInterval(pollingInterval);
            if (activeSession && activeSession.gameId === gameId) {
              const durationSeconds = Math.round((Date.now() - startTime) / 1000);
              if (durationSeconds > 0) {
                database.incrementPlaytime(gameId, durationSeconds);
                database.recordLaunchSession(gameId, durationSeconds);
              }
              activeSession = null;
              sendGameStatus(gameId, "stopped", durationSeconds);
            }
          }
        }
      });
    }, 5000);

    activeSession = {
      gameId,
      startTime,
      pollingInterval,
    };
  }
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
