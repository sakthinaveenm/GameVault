import React, { useState } from 'react';
import { useLibraryStore } from '@/stores/libraryStore';
import { api } from '@/services/tauri';
import { Game } from '@/types';
import {
  FolderSearch,
  X,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  RefreshCw,
  Plus,
} from 'lucide-react';

interface ScanFoldersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDirectory?: string;
}

export const ScanFoldersModal: React.FC<ScanFoldersModalProps> = ({
  isOpen,
  onClose,
  initialDirectory,
}) => {
  const { addGame } = useLibraryStore();

  const [scanDirectory, setScanDirectory] = useState('');
  const [suggestedDirs, setSuggestedDirs] = useState<string[]>([]);
  const [hostOs, setHostOs] = useState<'windows' | 'macos' | 'linux'>('windows');
  const [isScanning, setIsScanning] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [detectedItems, setDetectedItems] = useState<
    { title: string; path: string; platform: string; selected: boolean }[]
  >([]);

  React.useEffect(() => {
    if (!isOpen) return;

    if (initialDirectory) {
      setScanDirectory(initialDirectory);
    }

    api.getSystemInfo().then((info) => {
      const os = (info.os || 'windows').toLowerCase();
      if (os.includes('win')) {
        setHostOs('windows');
      } else if (os.includes('mac')) {
        setHostOs('macos');
      } else {
        setHostOs('linux');
      }
    }).catch(() => {});

    api.getDefaultGameDirectories().then((dirs) => {
      if (dirs && dirs.length > 0) {
        setSuggestedDirs(dirs);
        if (!initialDirectory) {
          setScanDirectory(dirs[0]);
        }
      } else if (!initialDirectory) {
        setScanDirectory('C:\\Games');
      }
    }).catch(() => {
      if (!initialDirectory) {
        setScanDirectory('C:\\Games');
      }
    });
  }, [isOpen, initialDirectory]);

  if (!isOpen) return null;

  const handleStartScan = async () => {
    if (!scanDirectory.trim()) return;
    setIsScanning(true);
    setScanCompleted(false);

    try {
      const results = await api.scanDirectory(scanDirectory.trim(), 3);
      if (results && results.length > 0) {
        setDetectedItems(
          results.map((r) => ({
            title: r.title,
            path: r.executable_path,
            platform: r.platform || hostOs,
            selected: true,
          }))
        );
      } else {
        setDetectedItems([]);
      }
    } catch {
      setDetectedItems([]);
    } finally {
      setIsScanning(false);
      setScanCompleted(true);
    }
  };

  const handleImportSelected = () => {
    detectedItems
      .filter((item) => item.selected)
      .forEach((item) => {
        const newGame: Game = {
          id: `scanned-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: item.title,
          source: 'local',
          platform: (item.platform as any) || hostOs,
          executablePath: item.path,
          installed: true,
          isFavorite: false,
          playtimeMinutes: 0,
        };
        addGame(newGame);
      });

    onClose();
  };

  const toggleSelect = (index: number) => {
    setDetectedItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <FolderSearch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Scan Local Folders</h3>
              <p className="text-xs text-slate-400">Discover installed games and binaries.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Directory Picker */}
        <div className="space-y-2 text-xs">
          <label className="font-semibold text-slate-300">Target Folder</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={scanDirectory}
              onChange={(e) => setScanDirectory(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-sky-500"
            />
            <button
              onClick={handleStartScan}
              disabled={isScanning || !scanDirectory.trim()}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-sky-500/25 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
            </button>
          </div>

          {/* Quick select pills */}
          {suggestedDirs.length > 0 && (
            <div className="flex items-center space-x-1.5 flex-wrap pt-1 gap-y-1">
              <span className="text-[11px] text-slate-500">Suggested:</span>
              {suggestedDirs.map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setScanDirectory(dir)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono border transition-all ${
                    scanDirectory === dir
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results / Detected Executables */}
        {scanCompleted && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Detected Executables ({detectedItems.length})
              </span>
              <span className="text-[11px] text-slate-500 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-400" />
                Select games to import
              </span>
            </div>

            {detectedItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                No game executables found in this directory. Try selecting another folder above.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {detectedItems.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleSelect(idx)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      item.selected
                        ? 'bg-sky-500/10 border-sky-500/40 text-slate-100'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="text-xs font-bold">{item.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{item.path}</div>
                    </div>

                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelect(idx)}
                      className="accent-sky-500 w-4 h-4 rounded"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          {scanCompleted && detectedItems.length > 0 && (
            <button
              onClick={handleImportSelected}
              disabled={detectedItems.filter((i) => i.selected).length === 0}
              className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Import Selected ({detectedItems.filter((i) => i.selected).length})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
