import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BootScreenProps {
  onComplete: () => void;
}

const loadingTips = [
  "Loading game library...",
  "Powering up collections...",
  "Polishing controller focus handlers...",
  "Loading database queries...",
  "Connecting virtual launcher engines...",
  "Ready to play!"
];

export function BootScreen({ onComplete }: BootScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  // Tip carousel
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % loadingTips.length);
    }, 1500);
    return () => clearInterval(tipInterval);
  }, []);

  // Simulated smooth boot loading sequence
  useEffect(() => {
    const start = Date.now();
    const duration = 2200; // 2.2 seconds loading animation

    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(timer);
        setTimeout(() => {
          setVisible(false);
          // Trigger complete callback after fade out animation
          setTimeout(onComplete, 600);
        }, 300);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-white select-none"
        >
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

          {/* Logo & Glow effect */}
          <div className="relative mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10 flex size-24 items-center justify-center rounded-3xl bg-[var(--accent)] text-zinc-950 font-black text-5xl shadow-[0_0_50px_var(--accent-glow-strong)] animate-glow"
            >
              G
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 size-24 rounded-3xl bg-[var(--accent)] blur-2xl pointer-events-none opacity-40"
            />
          </div>

          {/* App Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-extrabold tracking-tight"
          >
            GAME<span className="text-[var(--accent)]">VAULT</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-2 text-sm text-zinc-400 uppercase tracking-widest font-semibold"
          >
            Your Games. One Vault.
          </motion.p>

          {/* Loading bar container */}
          <div className="mt-16 w-64">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <motion.div
                style={{ width: `${progress}%` }}
                className="h-full rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] transition-all duration-30 ease-out"
              />
            </div>
            
            {/* Loading Tip */}
            <div className="mt-4 h-6 text-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={tipIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.25 }}
                  className="text-xs text-zinc-500 font-medium"
                >
                  {loadingTips[tipIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
