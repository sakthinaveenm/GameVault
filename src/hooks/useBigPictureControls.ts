import { useEffect, useRef } from "react";

const GAMEPAD_POLL_INTERVAL_MS = 80;
const GAMEPAD_REPEAT_DELAY_MS = 220;

export function useBigPictureControls(enabled: boolean, onExit: () => void): void {
  const lastActionAt = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const focusableElements = () => Array.from(document.querySelectorAll<HTMLElement>("[data-big-picture-focusable='true']"));
    const moveFocus = (direction: 1 | -1) => {
      const elements = focusableElements();
      if (elements.length === 0) return;
      const currentIndex = Math.max(0, elements.indexOf(document.activeElement as HTMLElement));
      elements[(currentIndex + direction + elements.length) % elements.length].focus();
    };
    const activateCurrent = () => (document.activeElement as HTMLElement | null)?.click();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "Escape") { onExit(); return; }
      if (["ArrowRight", "ArrowDown"].includes(event.key)) { event.preventDefault(); moveFocus(1); }
      if (["ArrowLeft", "ArrowUp"].includes(event.key)) { event.preventDefault(); moveFocus(-1); }
      if (["Enter", " "].includes(event.key)) { event.preventDefault(); activateCurrent(); }
    };
    const pollGamepad = () => {
      const gamepad = navigator.getGamepads().find(Boolean);
      if (!gamepad) return;
      const now = performance.now();
      if (now - lastActionAt.current < GAMEPAD_REPEAT_DELAY_MS) return;
      if (gamepad.buttons[14]?.pressed || gamepad.buttons[12]?.pressed) { moveFocus(-1); lastActionAt.current = now; }
      else if (gamepad.buttons[15]?.pressed || gamepad.buttons[13]?.pressed) { moveFocus(1); lastActionAt.current = now; }
      else if (gamepad.buttons[0]?.pressed) { activateCurrent(); lastActionAt.current = now; }
      else if (gamepad.buttons[1]?.pressed) { onExit(); lastActionAt.current = now; }
    };

    window.addEventListener("keydown", handleKeyDown);
    const pollId = window.setInterval(pollGamepad, GAMEPAD_POLL_INTERVAL_MS);
    window.setTimeout(() => focusableElements()[0]?.focus(), 0);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.clearInterval(pollId); };
  }, [enabled, onExit]);
}
