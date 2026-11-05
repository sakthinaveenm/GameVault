import React, { useState } from 'react';
import { api } from '@/services/tauri';
import {
  Network,
  Wifi,
  WifiOff,
  RefreshCw,
  Server,
  DownloadCloud,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';

export const BatoceraScreen: React.FC = () => {
  const [hostIp, setHostIp] = useState('192.168.1.150');
  const [port, setPort] = useState('22');
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'testing' | 'connected' | 'error'
  >('disconnected');
  const [statusMessage, setStatusMessage] = useState('Not connected to Batocera network node.');

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    const portNum = parseInt(port, 10) || 22;
    setStatusMessage(`Pinging Batocera node at ${hostIp}:${portNum}...`);

    try {
      const res = await api.pingBatoceraNode(hostIp, portNum);
      if (res.is_online) {
        setConnectionStatus('connected');
        setStatusMessage(`Successfully reached Batocera host ${hostIp}:${portNum} (latency: ${res.latency_ms ?? 0}ms).`);
      } else {
        setConnectionStatus('error');
        setStatusMessage(`Unable to reach Batocera node at ${hostIp}:${portNum}. Verify IP and ensure node is awake.`);
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setStatusMessage(`Connection error: ${err?.message || err || 'Network failure'}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0 select-none">
      {/* Top Header */}
      <div className="px-8 pt-6 pb-4 bg-[#0b0e14] border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Batocera Linux Integration</h1>
            <p className="text-xs text-slate-400">
              Connect to your local network Batocera machine, discover game systems, and import remote titles.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-8 py-6 space-y-6 max-w-4xl">
        {/* Connection Configuration Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Server className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-slate-200 text-sm">Host Configuration</h3>
            </div>

            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : connectionStatus === 'testing'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Connected</span>
                </>
              ) : connectionStatus === 'testing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Testing Connection</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Disconnected</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Batocera Local IP Address</label>
              <input
                type="text"
                value={hostIp}
                onChange={(e) => setHostIp(e.target.value)}
                placeholder="192.168.1.xxx or batocera.local"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-teal-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Port (Default: 22)</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-400">{statusMessage}</p>

            <button
              onClick={handleTestConnection}
              disabled={connectionStatus === 'testing'}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-teal-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${connectionStatus === 'testing' ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
          </div>
        </div>

        {/* Remote System Discovery */}
        {connectionStatus === 'connected' && (
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-200 text-sm">Discovered Batocera Libraries</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Remote game lists found on this host node.
                </p>
              </div>

              <button className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-teal-500/30 transition-all">
                <DownloadCloud className="w-4 h-4 text-teal-400" />
                <span>Import Game Lists</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'PlayStation 2', roms: 42, path: '/userdata/roms/ps2' },
                { name: 'Sega Dreamcast', roms: 28, path: '/userdata/roms/dreamcast' },
                { name: 'Nintendo 64', roms: 65, path: '/userdata/roms/n64' },
              ].map((sys, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200">{sys.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{sys.path}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 font-mono text-[10px] font-bold">
                    {sys.roms} ROMs
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

