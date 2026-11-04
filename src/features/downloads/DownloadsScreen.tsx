import React, { useState } from 'react';
import { DownloadItem } from '@/types';
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
} from 'lucide-react';

export const DownloadsScreen: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [downloads, setDownloads] = useState<DownloadItem[]>([
    {
      id: 'dl-1',
      title: 'FreeBSD Gaming Pack (Open-Source)',
      sourceUrl: 'https://example.org/downloads/game-pack.zip',
      destinationPath: '~/Downloads/game-pack.zip',
      totalBytes: 524288000,
      downloadedBytes: 314572800,
      speedBytesPerSec: 4194304,
      status: 'downloading',
    },
    {
      id: 'dl-2',
      title: 'OpenTTD (Transport Tycoon Deluxe Open Source)',
      sourceUrl: 'https://example.org/openttd.zip',
      destinationPath: '~/Downloads/openttd.zip',
      totalBytes: 73400320,
      downloadedBytes: 73400320,
      speedBytesPerSec: 0,
      status: 'completed',
    },
  ]);

  const handleAddDownload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const newDownload: DownloadItem = {
      id: `dl-${Date.now()}`,
      title: urlInput.split('/').pop() || 'Legal Game Package',
      sourceUrl: urlInput.trim(),
      destinationPath: `~/Downloads/${urlInput.split('/').pop() || 'download.bin'}`,
      totalBytes: 157286400,
      downloadedBytes: 0,
      speedBytesPerSec: 0,
      status: 'queued',
    };

    setDownloads([newDownload, ...downloads]);
    setUrlInput('');
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
    setDownloads(downloads.filter((d) => d.id !== id));
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
              Download legal game packages and user-provided direct links with pause/resume and integrity verification.
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
            Add Legal Direct Download URL or Magnet Link
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://... or magnet:?xt=urn:btih:..."
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={!urlInput.trim()}
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start Download</span>
            </button>
          </div>
        </form>

        {/* Download Queue */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Download Tasks ({downloads.length})
          </h3>

          {downloads.map((item) => {
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
                    <div className="flex items-center text-emerald-400 font-semibold space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready to Install</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

