import React, { useState, useEffect } from 'react';
import { useControllerStore } from '@/stores/controllerStore';
import {
  Gamepad2,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Zap,
} from 'lucide-react';

export const ControllerSettingsScreen: React.FC = () => {
  const { connectedControllers, activeController } = useControllerStore();

  const [activeButtons, setActiveButtons] = useState<number[]>([]);
  const [axes, setAxes] = useState<number[]>([0, 0, 0, 0]);
  const [deadzone, setDeadzone] = useState(0.25);
  const [vibrationTesting, setVibrationTesting] = useState(false);

  // Poll physical gamepad for real-time visualizer
  useEffect(() => {
    let animId: number;

    const poll = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];
      if (gp && gp.connected) {
        const pressed = gp.buttons
          .map((b, idx) => (b.pressed ? idx : -1))
          .filter((idx) => idx !== -1);
        setActiveButtons(pressed);
        setAxes([gp.axes[0] || 0, gp.axes[1] || 0, gp.axes[2] || 0, gp.axes[3] || 0]);
      }
      animId = requestAnimationFrame(poll);
    };

    animId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleTestVibration = () => {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0] as any;
    if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
      setVibrationTesting(true);
      gp.vibrationActuator
        .playEffect('dual-rumble', {
          startDelay: 0,
          duration: 600,
          weakMagnitude: 0.8,
          strongMagnitude: 0.8,
        })
        .finally(() => setVibrationTesting(false));
    } else {
      setVibrationTesting(true);
      setTimeout(() => setVibrationTesting(false), 600);
    }
  };

  const isBtnActive = (idx: number) => activeButtons.includes(idx);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0 select-none">
      {/* Top Header */}
      <div className="px-8 pt-6 pb-4 bg-[#0b0e14] border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Controller Subsystem & Calibration</h1>
              <p className="text-xs text-slate-400">
                Live gamepad visualizer, button remapping, analog dead-zone calibration, and haptic testing.
              </p>
            </div>
          </div>

          <button
            onClick={handleTestVibration}
            disabled={vibrationTesting}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <Zap className={`w-3.5 h-3.5 ${vibrationTesting ? 'animate-pulse text-amber-400' : ''}`} />
            <span>{vibrationTesting ? 'Vibrating...' : 'Test Haptic Rumble'}</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto min-h-0 px-8 py-6 space-y-6 max-w-5xl">
        {/* Detected Devices List */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-100 text-sm flex items-center">
            <Cpu className="w-4 h-4 text-sky-400 mr-2" />
            <span>Connected Gamepads</span>
          </h3>

          <div className="space-y-3">
            {connectedControllers.length > 0 ? (
              connectedControllers.map((ctrl) => (
                <div
                  key={ctrl.index}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold">
                      #{ctrl.index + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{ctrl.id}</div>
                      <div className="text-[11px] text-slate-500 capitalize">Type: {ctrl.type} • W3C Standard Gamepad</div>
                    </div>
                  </div>

                  <span className="flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Connected & Calibrated</span>
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center space-y-2">
                <Gamepad2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  No physical gamepad detected. Connect an Xbox, PlayStation, Switch Pro, or generic XInput controller via USB or Bluetooth.
                </p>
                <p className="text-[11px] text-slate-500">
                  Keyboard navigation (Arrow keys, Enter, Esc, Q/E) is currently active.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Live Controller Visualizer */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
          <h3 className="font-bold text-slate-100 text-sm flex items-center justify-between">
            <div className="flex items-center">
              <Sliders className="w-4 h-4 text-amber-400 mr-2" />
              <span>Real-Time Controller Tester</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Press buttons on your controller to test response
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Face Buttons & D-Pad */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-5">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Face Buttons & Bumpers
              </div>

              {/* Bumpers Row */}
              <div className="flex justify-between">
                <div
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isBtnActive(4)
                      ? 'bg-sky-500 text-white border-sky-400 scale-105 shadow-md shadow-sky-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  LB / L1 (Btn 4)
                </div>

                <div
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isBtnActive(5)
                      ? 'bg-sky-500 text-white border-sky-400 scale-105 shadow-md shadow-sky-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  RB / R1 (Btn 5)
                </div>
              </div>

              {/* Face Buttons Diamond */}
              <div className="flex justify-center py-2">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  {/* Y Button (Top, Btn 3) */}
                  <div
                    className={`absolute top-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                      isBtnActive(3)
                        ? 'bg-amber-500 text-slate-950 border-amber-300 scale-110 shadow-lg shadow-amber-500/50'
                        : 'bg-slate-900 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    Y / △
                  </div>

                  {/* X Button (Left, Btn 2) */}
                  <div
                    className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                      isBtnActive(2)
                        ? 'bg-sky-500 text-white border-sky-300 scale-110 shadow-lg shadow-sky-500/50'
                        : 'bg-slate-900 text-sky-400 border-sky-500/40'
                    }`}
                  >
                    X / □
                  </div>

                  {/* B Button (Right, Btn 1) */}
                  <div
                    className={`absolute right-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                      isBtnActive(1)
                        ? 'bg-rose-500 text-white border-rose-300 scale-110 shadow-lg shadow-rose-500/50'
                        : 'bg-slate-900 text-rose-400 border-rose-500/40'
                    }`}
                  >
                    B / ○
                  </div>

                  {/* A Button (Bottom, Btn 0) */}
                  <div
                    className={`absolute bottom-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                      isBtnActive(0)
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 scale-110 shadow-lg shadow-emerald-500/50'
                        : 'bg-slate-900 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    A / ✕
                  </div>
                </div>
              </div>

              {/* Start & Select */}
              <div className="flex justify-center space-x-6 pt-2">
                <div
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isBtnActive(8)
                      ? 'bg-sky-500 text-white border-sky-400'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  Select / Back (Btn 8)
                </div>

                <div
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isBtnActive(9)
                      ? 'bg-sky-500 text-white border-sky-400'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  Start / Menu (Btn 9)
                </div>
              </div>
            </div>

            {/* Right Column: Analog Sticks Coordinates */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-5">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Analog Sticks & D-Pad
              </div>

              {/* Left Stick Virtual Position */}
              <div className="flex items-center space-x-6 justify-center py-2">
                <div className="relative w-32 h-32 rounded-full border-2 border-slate-700 bg-slate-900/90 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-[1px] bg-slate-800" />
                    <div className="h-full w-[1px] bg-slate-800" />
                  </div>
                  <div
                    className="w-8 h-8 rounded-full bg-sky-500 shadow-md shadow-sky-500/40 transition-transform duration-75"
                    style={{
                      transform: `translate(${axes[0] * 40}px, ${axes[1] * 40}px)`,
                    }}
                  />
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <div className="text-slate-400 font-bold">Left Stick (Nav)</div>
                  <div className="text-slate-300">X: {axes[0].toFixed(3)}</div>
                  <div className="text-slate-300">Y: {axes[1].toFixed(3)}</div>
                  <div className="text-emerald-400 text-[10px]">
                    Dead-zone: {deadzone.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Dead-zone slider */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Dead-Zone Filter</span>
                  <span className="font-mono text-sky-400">{deadzone.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.55"
                  step="0.05"
                  value={deadzone}
                  onChange={(e) => setDeadzone(parseFloat(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

