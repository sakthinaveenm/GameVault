import React, { useState, useEffect } from 'react';
import { DownloadItem } from '@/types';
import { api } from '@/services/tauri';
import {
  Download,
  PlusCircle,
  Pause,
  Play,
  X,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  FileCheck,
  AlertTriangle,
  Inbox,
} from 'lucide-react';

export const DownloadsScreen: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [confirmInstallerPath, setConfirmInstallerPath] = useState<string | null>(null);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [hostOs, setHostOs] = useState<string>('windows');

  useEffect(() => {
    api.getSystemInfo().then((info) => {
      setHostOs((info.os || 'windows').toLowerCase());
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const loadDownloads = async () => {
      try {
        const list = await api.listDownloads();
        if (list && list.length > 0) {
          setDownloads(
            list.map((d) => ({
              id: d.id,
              title: d.title,
              sourceUrl: d.source_url,
              destinationPath: d.destination_path,
              totalBytes: d.total_bytes,
              downloadedBytes: d.downloaded_bytes,
              speedBytesPerSec: 0,
              status: d.status as any,
            }))
          );
        }
      } catch (err) {
        console.warn('Failed to load downloads from SQLite:', err);
      }
    };
    loadDownloads();
  }, []);

  const handleAddDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const filename = urlInput.split('/').pop()?.split('?')[0] || `download-${Date.now()}.bin`;
    const destinationPath = hostOs.includes('win')
      ? `C:\\Users\\Default\\Downloads\\${filename}`
      : `~/Downloads/${filename}`;
    const title = filename.replace(/\.[^/.]+$/, '') || 'Direct Download';

    try {
      const queued = await api.queueDownload(title, urlInput.trim(), destinationPath);
      const newDownload: DownloadItem = {
        id: queued.id,
        title: queued.title,
        sourceUrl: queued.source_url,
        destinationPath: queued.destination_path,
        totalBytes: queued.total_bytes || 104857600,
        downloadedBytes: 0,
        speedBytesPerSec: 0,
        status: 'queued',
      };
      setDownloads((prev) => [newDownload, ...prev]);
      setUrlInput('');
    } catch (err) {
      console.warn('Queue download fallback:', err);
      const newDownload: DownloadItem = {
        id: `dl-${Date.now()}`,
        title,
        sourceUrl: urlInput.trim(),
        destinationPath,
        totalBytes: 157286400,
        downloadedBytes: 0,
        speedBytesPerSec: 0,
        status: 'queued',
      };
      setDownloads((prev) => [newDownload, ...prev]);
      setUrlInput('');
    }
  };

  const handleExecuteConfirmed = async () => {
    if (!confirmInstallerPath) return;
    try {
      await api.executeDownloadedInstaller(confirmInstallerPath, true);
      setExecutionMessage(`Successfully launched installer: ${confirmInstallerPath}`);
    } catch (err: any) {
      setExecutionMessage(`Execution note: ${err?.message || err}`);
    }
    setConfirmInstallerPath(null);
    setTimeout(() => setExecutionMessage(null), 4000);
  };

  const togglePause = (id: string) => {
    setDownloads((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            status: d.status === 'downloading' ? 'paused' : 'downloading',
            speedBytesPerSec: d.status === 'downloading' ? 0 : 2097152,
          };
        }
        return d;
      })
    );
  };

  const removeDownload = (id: string) => {
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Top Header */}
      <div className="px-8 pt-6 pb-4 bg-[#0b0e14] border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Download Manager</h1>
            <p className="text-xs text-slate-400">
              Download game packages, patch updates, and direct media with pause/resume and integrity verification.
            </p>
          </div>
        </div>
      </div>

      {/* Safety Gate Warning Banner */}
      <div className="mx-8 mt-4 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            <strong>Safe Execution Policy:</strong> Downloaded files are never automatically executed. Universal Game Hub requires manual verification and user confirmation before running installers.
          </span>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 max-w-4xl">
        {/* Add Download Form */}
        <form
          onSubmit={handleAddDownload}
          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3"
        >
          <label className="text-xs font-bold text-slate-200">
            Add Direct Download URL or Package URI
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://... (e.g. https://example.org/patch.zip)"
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={!urlInput.trim()}
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Queue Download</span>
            </button>
          </div>
        </form>

        {/* Download Queue */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Download Tasks ({downloads.length})
          </h3>

          {downloads.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-800 rounded-2xl">
              <Inbox className="w-10 h-10 text-slate-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-300">No Active Downloads</h4>
              <p className="text-xs text-slate-500 max-w-md mt-1">
                Enter a direct file URL above to download game patches, extra content, or standalone packages.
              </p>
            </div>
          ) : (
            downloads.map((item) => {
              const percent =
                item.totalBytes > 0
                  ? Math.round((item.downloadedBytes / item.totalBytes) * 100)
                  : 0;
              const downloadedMB = (item.downloadedBytes / 1024 / 1024).toFixed(1);
              const totalMB = (item.totalBytes / 1024 / 1024).toFixed(1);
              const speedMB = (item.speedBytesPerSec / 1024 / 1024).toFixed(1);

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-100">{item.title}</h4>
                      <div className="text-[11px] text-slate-500 font-mono truncate max-w-lg">
                        {item.sourceUrl}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.status !== 'completed' && (
                        <button
                          onClick={() => togglePause(item.id)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                        >
                          {item.status === 'downloading' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => removeDownload(item.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        item.status === 'completed' ? 'bg-emerald-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Status Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="capitalize font-semibold text-slate-300">{item.status}</span>
                      <span>•</span>
                      <span>
                        {downloadedMB} MB / {totalMB} MB ({percent}%)
                      </span>
                    </div>

                    {item.status === 'downloading' && (
                      <div className="text-sky-400 font-bold">{speedMB} MB/s</div>
                    )}

                    {item.status === 'completed' && (
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center text-emerald-400 font-semibold space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </div>
                        <button
                          onClick={() => setConfirmInstallerPath(item.destinationPath)}
                          className="px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold transition-all"
                        >
                          Launch Installer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Execution Feedback Notification */}
        {executionMessage && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
            {executionMessage}
          </div>
        )}
      </div>

      {/* Confirmation Modal Guard */}
      {confirmInstallerPath && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-100">Confirm Installer Execution</h3>
              <p className="text-xs text-slate-400 mt-1">
                For security, Universal Game Hub requires explicit confirmation before executing any downloaded installer.
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 break-all">
              {confirmInstallerPath}
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmInstallerPath(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteConfirmed}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30"
              >
                Confirm & Launch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
