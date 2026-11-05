import { Plugin } from 'vite';
import { spawn, execFile, ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';

let ariaProcess: ChildProcess | null = null;

const getDownloadsDir = (): string => {
  const home = os.homedir();
  const dir = path.join(home, 'Downloads', 'UniversalGameHub', 'Torrents');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const checkPortOpen = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ jsonrpc: '2.0', id: 'ping', method: 'aria2.getVersion' });
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path: '/jsonrpc',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 1500,
      },
      (res) => {
        resolve(res.statusCode === 200);
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.write(payload);
    req.end();
  });
};

export function gamevaultDownloaderPlugin(): Plugin {
  return {
    name: 'gamevault-downloader-plugin',

    async configureServer(server) {
      const projectRoot = process.cwd();
      const binDir = path.join(projectRoot, 'bin');
      const ariaExe = path.join(binDir, 'aria2c.exe');
      const defaultDownloadDir = getDownloadsDir();

      // Check if aria2 RPC server is already running on port 6800
      const isAlreadyRunning = await checkPortOpen(6800);

      if (!isAlreadyRunning) {
        if (fs.existsSync(ariaExe)) {
          console.log('[GameVault Engine] Starting aria2c in-app download service on port 6800...');
          try {
            ariaProcess = spawn(
              ariaExe,
              [
                '--enable-rpc=true',
                '--rpc-listen-port=6800',
                '--rpc-listen-all=false',
                '--rpc-allow-origin-all=true',
                `--dir=${defaultDownloadDir}`,
                '--enable-dht=true',
                '--bt-enable-lpd=true',
                '--enable-peer-exchange=true',
                '--follow-torrent=mem',
                '--seed-time=0',
                '--max-connection-per-server=16',
                '--split=16',
                '--min-split-size=1M',
                '--file-allocation=none',
                '--summary-interval=0',
              ],
              {
                stdio: 'ignore',
                windowsHide: true,
              }
            );

            ariaProcess.on('error', (err) => {
              console.error('[GameVault Engine] Failed to spawn aria2c:', err.message);
            });

            console.log('[GameVault Engine] In-app downloader service running (PID:', ariaProcess.pid, ')');
          } catch (err: any) {
            console.warn('[GameVault Engine] Could not start aria2c process:', err.message);
          }
        } else {
          console.warn('[GameVault Engine] aria2c executable not found at', ariaExe);
        }
      } else {
        console.log('[GameVault Engine] In-app download service already active on port 6800.');
      }

      // Cleanup on server exit
      const cleanUp = () => {
        if (ariaProcess && !ariaProcess.killed) {
          try {
            ariaProcess.kill();
          } catch {}
          ariaProcess = null;
        }
      };

      process.on('exit', cleanUp);
      process.on('SIGINT', cleanUp);
      process.on('SIGTERM', cleanUp);

      // Middleware endpoints for System and Downloader management
      server.middlewares.use(async (req, res, next) => {
        const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const pathname = urlObj.pathname;

        if (pathname === '/api/downloader/health') {
          const alive = await checkPortOpen(6800);
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              running: alive,
              port: 6800,
              downloadDir: defaultDownloadDir,
              engine: 'aria2c',
            })
          );
          return;
        }

        if (pathname === '/api/system/download-dir') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ downloadDir: defaultDownloadDir }));
          return;
        }

        if (pathname === '/api/system/open-folder') {
          const targetPath = urlObj.searchParams.get('path') || defaultDownloadDir;
          const cleanPath = path.normalize(targetPath);
          console.log('[GameVault System] Opening explorer folder:', cleanPath);

          if (fs.existsSync(cleanPath)) {
            if (process.platform === 'win32') {
              execFile('explorer.exe', [cleanPath]);
            } else if (process.platform === 'darwin') {
              execFile('open', [cleanPath]);
            } else {
              execFile('xdg-open', [cleanPath]);
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, path: cleanPath }));
          } else {
            // If subfolder doesn't exist yet, open the main download directory
            if (process.platform === 'win32') {
              execFile('explorer.exe', [defaultDownloadDir]);
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, fallback: true, path: defaultDownloadDir }));
          }
          return;
        }

        if (pathname === '/api/system/find-installer') {
          const targetDir = urlObj.searchParams.get('dir') || defaultDownloadDir;
          let foundInstaller: string | null = null;

          if (fs.existsSync(targetDir)) {
            const files = fs.readdirSync(targetDir);
            // Look for setup.exe or installer.exe first
            const primarySetup = files.find((f) => /^setup\.exe$/i.test(f));
            const secondaryInstaller = files.find((f) => /installer\.exe$/i.test(f) || /install\.exe$/i.test(f));
            const anyExe = files.find((f) => /\.exe$/i.test(f) && !/uninstall/i.test(f));

            const match = primarySetup || secondaryInstaller || anyExe;
            if (match) {
              foundInstaller = path.join(targetDir, match);
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ installer: foundInstaller }));
          return;
        }

        if (pathname === '/api/system/run-installer') {
          const installerPath = urlObj.searchParams.get('path');
          if (installerPath && fs.existsSync(installerPath) && /\.exe$/i.test(installerPath)) {
            console.log('[GameVault System] Launching downloaded installer:', installerPath);
            const child = spawn(installerPath, [], {
              detached: true,
              stdio: 'ignore',
            });
            child.unref();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, pid: child.pid }));
            return;
          }
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Invalid or missing installer executable.' }));
          return;
        }

        next();
      });
    },
  };
}
