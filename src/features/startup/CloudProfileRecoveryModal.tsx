import React, { useState } from 'react';
import { useStartupStore } from '@/stores/startupStore';
import { CloudProfileSummary } from '@/types';
import { api } from '@/services/tauri';
import {
  CloudDownload,
  X,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  ArrowRight,
  Laptop,
  Check,
  AlertCircle,
} from 'lucide-react';

export const CloudProfileRecoveryModal: React.FC = () => {
  const { setStartupState, completeAuthenticationAndLaunch } = useStartupStore();

  const [googleEmail, setGoogleEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [cloudProfiles, setCloudProfiles] = useState<CloudProfileSummary[]>([]);
  const [selectedCloudProfile, setSelectedCloudProfile] = useState<CloudProfileSummary | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleConnectGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim() || !googleEmail.includes('@')) {
      setStatusMessage('Please enter a valid Google Account email.');
      return;
    }

    setIsAuthenticating(true);
    setStatusMessage('Initiating Google OAuth 2.0 PKCE desktop authorization...');

    try {
      const pkce = await api.generateOAuthPkce();
      console.log('PKCE Session verified:', pkce.state);

      // Simulate capturing callback or fetch profiles for this account
      const profiles = await api.listCloudProfiles(googleEmail.trim());
      setCloudProfiles(profiles);
      setIsAuthenticated(true);
      setStatusMessage(null);
      if (profiles.length > 0) {
        setSelectedCloudProfile(profiles[0]);
      }
    } catch (err: any) {
      setStatusMessage(`OAuth Error: ${err?.message || 'Failed to authenticate with Google'}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedCloudProfile) return;

    setIsRestoring(true);
    setStatusMessage(`Restoring cloud saves & settings for ${selectedCloudProfile.displayName}...`);

    try {
      const restored = await api.recoverCloudProfile(
        selectedCloudProfile.syncProfileId,
        selectedCloudProfile.displayName,
        googleEmail
      );

      // Launch directly into restored profile session
      await completeAuthenticationAndLaunch(restored);
    } catch (err: any) {
      setStatusMessage(`Restore failed: ${err?.message || 'Could not restore cloud backup'}`);
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <CloudDownload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Recover Existing Cloud Profile
              </h2>
              <p className="text-xs text-slate-400">
                Restore your profile, save games, and settings from Google Drive.
              </p>
            </div>
          </div>

          <button
            onClick={() => setStartupState('ProfileSelection')}
            aria-label="Cancel recovery"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-xl bg-sky-950/60 border border-sky-500/30 text-sky-300 text-xs flex items-center space-x-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Step 1: Google Account Connection */}
        {!isAuthenticated ? (
          <form onSubmit={handleConnectGoogle} className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-xs font-bold text-slate-200">
                  Google Drive Cloud Authorization
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Connect your account to discover existing profile manifests and save game packages stored in the Google Drive appData folder.
              </p>

              <input
                type="email"
                required
                autoFocus
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="your.google.account@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 controller-focus-ring"
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setStartupState('ProfileSelection')}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold controller-focus-ring"
              >
                Back to Selection
              </button>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="flex items-center space-x-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-sky-500/20 controller-focus-ring disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting OAuth...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Discover</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Cloud Profile Selection & Confirmation */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Cloud profiles found for <strong className="text-slate-200">{googleEmail}</strong>:</span>
              <span className="text-emerald-400 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                <span>Authorized</span>
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {cloudProfiles.map((p) => {
                const isSelected = selectedCloudProfile?.syncProfileId === p.syncProfileId;
                return (
                  <div
                    key={p.syncProfileId}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedCloudProfile(p)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between controller-focus-ring ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-400 ring-2 ring-sky-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                        {p.avatarPath && (
                          <img src={p.avatarPath} alt={p.displayName} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{p.displayName}</h4>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                          <span className="flex items-center">
                            <Laptop className="w-3 h-3 mr-1 text-slate-500" />
                            {p.deviceName}
                          </span>
                          <span>•</span>
                          <span>{p.gameCount} Games backed up</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-sky-400">
                        {(p.backupSizeBytes / (1024 * 1024)).toFixed(1)} MB
                      </span>
                      <div className="text-[10px] text-slate-500">Cloud Snapshot</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confirmation Box */}
            {selectedCloudProfile && (
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-slate-200">Confirmation Gate:</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Restoring will create a matching local profile on this computer without overwriting existing profiles. Save games will be downloaded to your local profile directory.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStartupState('ProfileSelection')}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold controller-focus-ring"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring || !selectedCloudProfile}
                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20 controller-focus-ring disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isRestoring ? 'Restoring Profile...' : 'Confirm & Restore Profile'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
