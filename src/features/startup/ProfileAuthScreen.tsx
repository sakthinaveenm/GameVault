import React, { useState } from 'react';
import { useStartupStore } from '@/stores/startupStore';
import { api } from '@/services/tauri';
import {
  Lock,
  ArrowLeft,
  KeyRound,
  AlertCircle,
  Delete,
  Check,
  ShieldAlert,
} from 'lucide-react';

export const ProfileAuthScreen: React.FC = () => {
  const {
    selectedCandidate,
    setStartupState,
    completeAuthenticationAndLaunch,
  } = useStartupStore();

  const [inputCode, setInputCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);

  if (!selectedCandidate) {
    return null;
  }

  const isPin = selectedCandidate.authType === 'pin';

  const handleVerify = async (secretToTest?: string) => {
    const code = secretToTest !== undefined ? secretToTest : inputCode;
    if (!code.trim() || isLockedOut) return;

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await api.verifyProfileCredentials(selectedCandidate.id, code.trim());
      if (res.success) {
        await completeAuthenticationAndLaunch(selectedCandidate);
      } else {
        const nextAttempts = Math.max(0, attemptsRemaining - 1);
        setAttemptsRemaining(nextAttempts);
        setInputCode('');

        if (nextAttempts === 0) {
          setIsLockedOut(true);
          setErrorMessage('Too many failed attempts. Profile temporarily locked for 30 seconds.');
          setTimeout(() => {
            setIsLockedOut(false);
            setAttemptsRemaining(3);
            setErrorMessage(null);
          }, 30000);
        } else {
          setErrorMessage(
            res.message || `Incorrect credentials. ${nextAttempts} attempt${nextAttempts === 1 ? '' : 's'} remaining.`
          );
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication service error.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (inputCode.length < 8 && !isLockedOut) {
      const next = inputCode + digit;
      setInputCode(next);
      if (isPin && next.length === 4) {
        handleVerify(next);
      }
    }
  };

  const handleBackspace = () => {
    setInputCode((prev) => prev.slice(0, -1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (isPin && /^[0-9]$/.test(e.key)) {
      handleKeypadPress(e.key);
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className="relative min-h-screen w-screen bg-[#07090e] text-slate-100 flex flex-col justify-between p-8 sm:p-12 select-none overflow-hidden font-sans"
    >
      {/* Background Ambience */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between border-b border-slate-800 pb-4 z-10">
        <button
          type="button"
          onClick={() => setStartupState('ProfileSelection')}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-colors controller-focus-ring"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Profile</span>
        </button>

        <span className="text-xs text-amber-400 font-mono flex items-center space-x-1">
          <Lock className="w-3.5 h-3.5" />
          <span>Local Authentication</span>
        </span>
      </div>

      {/* Center Auth Challenge */}
      <div className="my-auto w-full max-w-sm mx-auto flex flex-col items-center text-center space-y-6 z-10">
        {/* Avatar of profile to unlock */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl overflow-hidden bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 shadow-2xl">
            {selectedCandidate.avatarPath ? (
              <img
                src={selectedCandidate.avatarPath}
                alt={selectedCandidate.displayName}
                className="w-full h-full object-cover rounded-[22px]"
              />
            ) : (
              <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center text-white text-2xl font-black">
                {selectedCandidate.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-950 border border-amber-500 text-amber-400 shadow-md">
            <KeyRound className="w-3.5 h-3.5" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Unlock {selectedCandidate.displayName}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isPin ? 'Enter your 4-digit PIN to play' : 'Enter your local profile password'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="w-full p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="text-left">{errorMessage}</span>
          </div>
        )}

        {/* PIN Dots or Password Input */}
        {isPin ? (
          <div className="flex items-center space-x-4 py-2">
            {[0, 1, 2, 3].map((slot) => {
              const isFilled = inputCode.length > slot;
              return (
                <div
                  key={slot}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    isFilled
                      ? 'bg-amber-400 ring-4 ring-amber-500/30 scale-125'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                />
              );
            })}
          </div>
        ) : (
          <div className="w-full space-y-3">
            <input
              type="password"
              autoFocus
              disabled={isLockedOut}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Enter password..."
              className="w-full px-4 py-3 text-center bg-slate-950 border border-slate-700 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-amber-400 transition-colors controller-focus-ring"
            />
            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={isVerifying || isLockedOut || !inputCode.trim()}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 controller-focus-ring disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Unlock Profile'}
            </button>
          </div>
        )}

        {/* Console-style Numerical Keypad for PIN */}
        {isPin && (
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px] pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                disabled={isLockedOut}
                onClick={() => handleKeypadPress(digit)}
                className="h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-200 text-lg font-bold transition-all active:scale-95 controller-focus-ring disabled:opacity-40"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              disabled={isLockedOut || inputCode.length === 0}
              onClick={handleBackspace}
              aria-label="Backspace"
              className="h-12 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all controller-focus-ring disabled:opacity-40"
            >
              <Delete className="w-5 h-5" />
            </button>
            <button
              type="button"
              disabled={isLockedOut}
              onClick={() => handleKeypadPress('0')}
              className="h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-200 text-lg font-bold transition-all active:scale-95 controller-focus-ring disabled:opacity-40"
            >
              0
            </button>
            <button
              type="button"
              disabled={isLockedOut || inputCode.length === 0}
              onClick={() => handleVerify()}
              aria-label="Enter"
              className="h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold transition-all controller-focus-ring disabled:opacity-40"
            >
              <Check className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        )}

        {/* Security Info */}
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-mono">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
          <span>{attemptsRemaining} verification attempts remaining</span>
        </div>
      </div>

      {/* Bottom Footer Hint */}
      <div className="w-full max-w-md mx-auto text-center text-xs text-slate-500 font-mono z-10">
        D-Pad or NumPad to input PIN. Press B or Escape to cancel.
      </div>
    </div>
  );
};
