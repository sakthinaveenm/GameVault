// GameVault In-App Aria2 JSON-RPC Client & Download Engine

export interface Aria2File {
  index: string;
  path: string;
  length: string;
  completedLength: string;
  selected: string;
}

export interface Aria2Bittorrent {
  announceList?: string[][];
  comment?: string;
  creationDate?: number;
  info?: {
    name?: string;
  };
  mode?: 'single' | 'multi';
}

export interface Aria2TaskStatus {
  gid: string;
  status: 'active' | 'waiting' | 'paused' | 'error' | 'complete' | 'removed';
  totalLength: string;
  completedLength: string;
  uploadLength: string;
  downloadSpeed: string;
  uploadSpeed: string;
  infoHash?: string;
  numSeeders?: string;
  connections: string;
  errorCode?: string;
  errorMessage?: string;
  followedBy?: string[];
  following?: string;
  dir: string;
  files: Aria2File[];
  bittorrent?: Aria2Bittorrent;
}

export interface ManagedTorrent {
  id: string; // usually aria2 GID
  gid: string;
  name: string;
  magnetUri: string;
  savePath: string;
  totalBytes: number;
  downloadedBytes: number;
  uploadedBytes: number;
  downloadSpeed: number;
  uploadSpeed: number;
  progress: number;
  peers: number;
  seeds: number;
  state: 'queued' | 'connecting' | 'downloading' | 'seeding' | 'paused' | 'completed' | 'error';
  files: string[];
  installerPath?: string;
  createdAt: string;
  updatedAt: string;
}

const RPC_URL = 'http://127.0.0.1:6800/jsonrpc';

class Aria2Service {
  private rpcId = 1;
  private taskNameMap = new Map<string, { name: string; magnetUri: string; customPath?: string }>();

  constructor() {
    this.loadTaskNameMap();
  }

  private loadTaskNameMap() {
    try {
      const stored = localStorage.getItem('gamevault_aria2_tasks');
      if (stored) {
        const parsed = JSON.parse(stored);
        for (const [gid, val] of Object.entries(parsed)) {
          this.taskNameMap.set(gid, val as any);
        }
      }
    } catch {}
  }

  private saveTaskNameMap() {
    try {
      const obj: Record<string, any> = {};
      for (const [k, v] of this.taskNameMap.entries()) {
        obj[k] = v;
      }
      localStorage.setItem('gamevault_aria2_tasks', JSON.stringify(obj));
    } catch {}
  }

  private async call<T>(method: string, params: any[] = []): Promise<T> {
    const id = `gv-${this.rpcId++}`;
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`Aria2 RPC HTTP error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`Aria2 RPC error [${data.error.code}]: ${data.error.message}`);
    }

    return data.result as T;
  }

  /**
   * Pings the in-app aria2 JSON-RPC daemon to check availability.
   */
  async isOnline(): Promise<boolean> {
    try {
      const res = await this.call<{ version: string }>('aria2.getVersion');
      return Boolean(res?.version);
    } catch {
      return false;
    }
  }

  /**
   * Adds a magnet link directly into the GameVault download engine.
   */
  async addMagnet(
    magnetUri: string,
    gameName?: string,
    customDir?: string
  ): Promise<{ gid: string; name: string; savePath: string }> {
    const safeName = gameName ? gameName.replace(/[/\\?%*:|"<>]/g, '_').trim() : 'Torrent-Download';
    const options: Record<string, any> = {};

    if (customDir) {
      options.dir = customDir;
    } else {
      // Get base directory from server or fallback
      const baseDir = await this.getDefaultDownloadDir();
      options.dir = `${baseDir}/${safeName}`;
    }

    const gid = await this.call<string>('aria2.addUri', [[magnetUri], options]);

    this.taskNameMap.set(gid, {
      name: safeName,
      magnetUri,
      customPath: options.dir,
    });
    this.saveTaskNameMap();

    return {
      gid,
      name: safeName,
      savePath: options.dir,
    };
  }

  /**
   * Adds direct HTTP/HTTPS download link into the engine.
   */
  async addDirectDownload(
    url: string,
    filename: string,
    customDir?: string
  ): Promise<string> {
    const options: Record<string, any> = {};
    if (customDir) {
      options.dir = customDir;
    }
    if (filename) {
      options.out = filename;
    }

    const gid = await this.call<string>('aria2.addUri', [[url], options]);
    this.taskNameMap.set(gid, {
      name: filename || 'Direct Download',
      magnetUri: url,
      customPath: options.dir,
    });
    this.saveTaskNameMap();
    return gid;
  }

  async tellStatus(gid: string): Promise<Aria2TaskStatus | null> {
    try {
      return await this.call<Aria2TaskStatus>('aria2.tellStatus', [gid]);
    } catch {
      return null;
    }
  }

  async tellActive(): Promise<Aria2TaskStatus[]> {
    try {
      return await this.call<Aria2TaskStatus[]>('aria2.tellActive');
    } catch {
      return [];
    }
  }

  async tellWaiting(offset = 0, num = 100): Promise<Aria2TaskStatus[]> {
    try {
      return await this.call<Aria2TaskStatus[]>('aria2.tellWaiting', [offset, num]);
    } catch {
      return [];
    }
  }

  async tellStopped(offset = 0, num = 100): Promise<Aria2TaskStatus[]> {
    try {
      return await this.call<Aria2TaskStatus[]>('aria2.tellStopped', [offset, num]);
    } catch {
      return [];
    }
  }

  async pause(gid: string): Promise<void> {
    await this.call('aria2.pause', [gid]);
  }

  async unpause(gid: string): Promise<void> {
    await this.call('aria2.unpause', [gid]);
  }

  async remove(gid: string): Promise<void> {
    try {
      await this.call('aria2.remove', [gid]);
    } catch {
      try {
        await this.call('aria2.removeDownloadResult', [gid]);
      } catch {}
    }
    this.taskNameMap.delete(gid);
    this.saveTaskNameMap();
  }

  async getGlobalStat(): Promise<{ downloadSpeed: number; uploadSpeed: number; numActive: number }> {
    try {
      const stat = await this.call<{
        downloadSpeed: string;
        uploadSpeed: string;
        numActive: string;
      }>('aria2.getGlobalStat');
      return {
        downloadSpeed: parseInt(stat.downloadSpeed, 10) || 0,
        uploadSpeed: parseInt(stat.uploadSpeed, 10) || 0,
        numActive: parseInt(stat.numActive, 10) || 0,
      };
    } catch {
      return { downloadSpeed: 0, uploadSpeed: 0, numActive: 0 };
    }
  }

  /**
   * Retrieves all managed torrent downloads formatted for GameVault UI.
   */
  async getAllManagedTasks(): Promise<ManagedTorrent[]> {
    const [active, waiting, stopped] = await Promise.all([
      this.tellActive(),
      this.tellWaiting(0, 50),
      this.tellStopped(0, 50),
    ]);

    const combined = [...active, ...waiting, ...stopped];
    const results: ManagedTorrent[] = [];
    const seenGids = new Set<string>();

    for (const task of combined) {
      if (seenGids.has(task.gid)) continue;
      seenGids.add(task.gid);

      const meta = this.taskNameMap.get(task.gid);
      const torrentName =
        meta?.name ||
        task.bittorrent?.info?.name ||
        (task.files[0]?.path ? task.files[0].path.split(/[\\/]/).pop() : undefined) ||
        `Download-${task.gid.substring(0, 8)}`;

      const total = parseInt(task.totalLength, 10) || 0;
      const completed = parseInt(task.completedLength, 10) || 0;
      const dlSpeed = parseInt(task.downloadSpeed, 10) || 0;
      const ulSpeed = parseInt(task.uploadSpeed, 10) || 0;
      const progress = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;
      const peers = parseInt(task.connections, 10) || 0;
      const seeds = parseInt(task.numSeeders || '0', 10) || 0;

      let state: ManagedTorrent['state'] = 'queued';
      if (task.status === 'active') {
        state = total > 0 ? 'downloading' : 'connecting';
      } else if (task.status === 'paused') {
        state = 'paused';
      } else if (task.status === 'complete') {
        state = 'completed';
      } else if (task.status === 'error') {
        state = 'error';
      }

      results.push({
        id: task.gid,
        gid: task.gid,
        name: torrentName,
        magnetUri: meta?.magnetUri || '',
        savePath: task.dir,
        totalBytes: total,
        downloadedBytes: completed,
        uploadedBytes: parseInt(task.uploadLength, 10) || 0,
        downloadSpeed: dlSpeed,
        uploadSpeed: ulSpeed,
        progress,
        peers,
        seeds,
        state,
        files: task.files.map((f) => f.path).filter(Boolean),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return results;
  }

  /**
   * System API to open directory in Windows Explorer.
   */
  async openFolder(folderPath: string): Promise<void> {
    try {
      await fetch(`/api/system/open-folder?path=${encodeURIComponent(folderPath)}`);
    } catch (e) {
      console.warn('Failed to open explorer folder via API:', e);
    }
  }

  /**
   * System API to find installer in downloaded directory.
   */
  async findInstaller(folderPath: string): Promise<string | null> {
    try {
      const res = await fetch(`/api/system/find-installer?dir=${encodeURIComponent(folderPath)}`);
      const data = await res.json();
      return data.installer || null;
    } catch {
      return null;
    }
  }

  /**
   * System API to run executable installer.
   */
  async runInstaller(installerPath: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/system/run-installer?path=${encodeURIComponent(installerPath)}`);
      const data = await res.json();
      return Boolean(data.ok);
    } catch {
      return false;
    }
  }

  async getDefaultDownloadDir(): Promise<string> {
    try {
      const res = await fetch('/api/system/download-dir');
      const data = await res.json();
      if (data.downloadDir) return data.downloadDir;
    } catch {}
    return '~/Downloads/UniversalGameHub/Torrents';
  }
}

export const aria2Client = new Aria2Service();

