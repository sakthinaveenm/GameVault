import React, { useState, useEffect, useRef } from 'react';
import { Emulator } from '@/types';
import { api } from '@/services/tauri';
import {
  Cpu,
  CheckCircle2,
  XCircle,
  FolderOpen,
  Sliders,
  Check,
} from 'lucide-react';

const EMULATORS_OVERRIDE_KEY = 'ugh_emulators_overrides';

const INITIAL_EMULATORS: Emulator[] = [
  {
    id: 'retroarch',
    name: 'RetroArch',
    systemId: 'multi',
    executablePath: 'C:\\RetroArch-Win64\\retroarch.exe',
    supportedExtensions: ['nes', 'snes', 'sfc', 'gba', 'gbc', 'bin', 'cue'],
    defaultArguments: '',
    detected: false,
  },
  {
    id: 'dolphin',
    name: 'Dolphin',
    systemId: 'gamecube_wii',
    executablePath: 'C:\\Program Files\\Dolphin\\Dolphin.exe',
    supportedExtensions: ['iso', 'gcm', 'wbfs', 'ciso'],
    defaultArguments: '-b -e',
    detected: false,
  },
  {
    id: 'pcsx2',
    name: 'PCSX2',
    systemId: 'ps2',
    executablePath: 'C:\\Program Files\\PCSX2\\pcsx2-qtx64.exe',
    supportedExtensions: ['iso', 'bin', 'chd', 'gz'],
    defaultArguments: '-nogui',
    detected: false,
  },
  {
    id: 'ppsspp',
    name: 'PPSSPP',
    systemId: 'psp',
    executablePath: 'C:\\Program Files\\PPSSPP\\PPSSPPWindows64.exe',
    supportedExtensions: ['iso', 'cso', 'pbp'],
    defaultArguments: '',
    detected: false,
  },
];

export const EmulatorsScreen: React.FC = () => {
  const [emulators, setEmulators] = useState<Emulator[]>(INITIAL_EMULATORS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPath, setEditPath] = useState('');
  const [editArgs, setEditArgs] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadEmulators = async () => {
      let emuList = INITIAL_EMULATORS;
      try {
        const detected = await api.getKnownEmulators();
        if (detected && detected.length > 0) {
          emuList = detected;
        }
      } catch (err) {
        console.warn('Failed to load emulators from backend:', err);
      }

      // Apply any user overrides saved in localStorage
      try {
        const saved = localStorage.getItem(EMULATORS_OVERRIDE_KEY);
        if (saved) {
          const overrides: Record<string, { executablePath: string; defaultArguments?: string }> =
            JSON.parse(saved);
          emuList = emuList.map((e) => {
            if (overrides[e.id]) {
              return {
                ...e,
                executablePath: overrides[e.id].executablePath,
                defaultArguments: overrides[e.id].defaultArguments ?? e.defaultArguments,
              };
            }
            return e;
          });
        }
      } catch {
        // Ignore JSON error
      }

      setEmulators(emuList);
    };

    loadEmulators();
  }, []);

  const handleStartEdit = (emu: Emulator) => {
    setEditingId(emu.id);
    setEditPath(emu.executablePath);
    setEditArgs(emu.defaultArguments || '');
  };

  const handleSaveEdit = (id: string) => {
    const updated = emulators.map((e) =>
      e.id === id ? { ...e, executablePath: editPath, defaultArguments: editArgs } : e
    );
    setEmulators(updated);
    setEditingId(null);

    // Save to localStorage
    try {
      const overrides: Record<string, { executablePath: string; defaultArguments?: string }> = {};
      updated.forEach((e) => {
        overrides[e.id] = {
          executablePath: e.executablePath,
          defaultArguments: e.defaultArguments,
        };
      });
      localStorage.setItem(EMULATORS_OVERRIDE_KEY, JSON.stringify(overrides));
    } catch {
      // Ignore
    }
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const path = (file as any).path || file.name;
      setEditPath(path);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0 select-none">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilePicked}
        style={{ display: 'none' }}
      />

      {/* Top Header */}
      <div className="px-8 pt-6 pb-4 bg-[#0b0e14] border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Emulators Manager</h1>
            <p className="text-xs text-slate-400">
              Configure executable binaries, launch parameters, and associate ROM extensions.
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0 px-8 py-6 space-y-4">
        {emulators.map((emu) => {
          const isEditing = editingId === emu.id;

          return (
            <div
              key={emu.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 font-bold">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{emu.name}</h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-xs font-mono text-slate-400">System: {emu.systemId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      emu.detected
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {emu.detected ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Detected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Configured</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => (isEditing ? handleSaveEdit(emu.id) : handleStartEdit(emu))}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
                  >
                    {isEditing ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Done</span>
                      </>
                    ) : (
                      <>
                        <Sliders className="w-3.5 h-3.5 text-sky-400" />
                        <span>Configure</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Supported Extensions */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Supported ROMs:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {emu.supportedExtensions.map((ext) => (
                    <span
                      key={ext}
                      className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 text-[11px] font-mono text-slate-300 uppercase"
                    >
                      .{ext}
                    </span>
                  ))}
                </div>
              </div>

              {/* Executable Path & Arguments */}
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Executable Binary Path</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editPath}
                        onChange={(e) => setEditPath(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-300 transition-colors"
                        title="Browse for executable"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Default Command Flags</label>
                    <input
                      type="text"
                      value={editArgs}
                      onChange={(e) => setEditArgs(e.target.value)}
                      placeholder="-fullscreen"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-mono bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 truncate">
                  <span className="text-slate-500">Path: </span>
                  {emu.executablePath}{' '}
                  {emu.defaultArguments && (
                    <span className="text-sky-400/80 ml-2">Args: {emu.defaultArguments}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
