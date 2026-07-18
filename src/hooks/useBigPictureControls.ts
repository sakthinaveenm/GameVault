import { useEffect, useRef } from "react";

const GAMEPAD_POLL_INTERVAL_MS = 80;
const GAMEPAD_REPEAT_DELAY_MS = 220;

export function useBigPictureControls(
  enabled: boolean,
  onExit: () => void,
  onToggleMenu?: () => void,
  onBack?: () => void
): void {
  const lastActionAt = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const focusableElements = () =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-big-picture-focusable='true']"))
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && getComputedStyle(el).display !== "none";
        });

    const moveFocus2D = (direction: "left" | "right" | "up" | "down") => {
      const elements = focusableElements();
      if (elements.length === 0) return;

      const active = document.activeElement as HTMLElement;
      if (!active || !elements.includes(active)) {
        elements[0].focus();
        return;
      }

      const activeRect = active.getBoundingClientRect();
      const cx = activeRect.left + activeRect.width / 2;
      const cy = activeRect.top + activeRect.height / 2;

      let bestCand: HTMLElement | null = null;
      let minScore = Infinity;

      for (const cand of elements) {
        if (cand === active) continue;

        const rect = cand.getBoundingClientRect();
        const candCx = rect.left + rect.width / 2;
        const candCy = rect.top + rect.height / 2;

        const dx = candCx - cx;
        const dy = candCy - cy;

        let isCorrectDirection = false;
        let score = 0;

        // Tolerance ratio for orthogonal alignment (wide cone)
        const coneRatio = 1.6;

        switch (direction) {
          case "right":
            isCorrectDirection = dx > 0 && Math.abs(dy) < dx * coneRatio;
            score = dx * dx + 5 * dy * dy; // Penalize off-axis deviation
            break;
          case "left":
            isCorrectDirection = dx < 0 && Math.abs(dy) < Math.abs(dx) * coneRatio;
            score = dx * dx + 5 * dy * dy;
            break;
          case "down":
            isCorrectDirection = dy > 0 && Math.abs(dx) < dy * coneRatio;
            score = 5 * dx * dx + dy * dy;
            break;
          case "up":
            isCorrectDirection = dy < 0 && Math.abs(dx) < Math.abs(dy) * coneRatio;
            score = 5 * dx * dx + dy * dy;
            break;
        }

        if (isCorrectDirection && score < minScore) {
          minScore = score;
          bestCand = cand;
        }
      }

      if (bestCand) {
        bestCand.focus();
      }
    };

    const activateCurrent = () => {
      const active = document.activeElement as HTMLElement | null;
      if (active) {
        active.click();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) {
        // Allow text input typing, but handle Escape and Enter
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          event.target.blur();
          if (onToggleMenu) onToggleMenu();
        }
        return;
      }

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          moveFocus2D("right");
          break;
        case "ArrowLeft":
          event.preventDefault();
          moveFocus2D("left");
          break;
        case "ArrowDown":
          event.preventDefault();
          moveFocus2D("down");
          break;
        case "ArrowUp":
          event.preventDefault();
          moveFocus2D("up");
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          activateCurrent();
          break;
        case "Escape":
          event.preventDefault();
          if (onToggleMenu) {
            onToggleMenu();
          } else {
            onExit();
          }
          break;
        case "Backspace":
          if (onBack) {
            event.preventDefault();
            onBack();
          }
          break;
      }
    };

    const pollGamepad = () => {
      const gamepad = navigator.getGamepads().find(Boolean);
      if (!gamepad) return;

      const now = performance.now();
      if (now - lastActionAt.current < GAMEPAD_REPEAT_DELAY_MS) return;

      // Stick axes threshold
      const AXIS_THRESHOLD = 0.5;

      let triggered = false;

      // Check D-Pad and Left stick
      const dpadUp = gamepad.buttons[12]?.pressed || gamepad.axes[1] < -AXIS_THRESHOLD;
      const dpadDown = gamepad.buttons[13]?.pressed || gamepad.axes[1] > AXIS_THRESHOLD;
      const dpadLeft = gamepad.buttons[14]?.pressed || gamepad.axes[0] < -AXIS_THRESHOLD;
      const dpadRight = gamepad.buttons[15]?.pressed || gamepad.axes[0] > AXIS_THRESHOLD;

      const btnA = gamepad.buttons[0]?.pressed; // Confirm (A / X on PlayStation)
      const btnB = gamepad.buttons[1]?.pressed; // Back (B / O on PlayStation)
      const btnMenu = gamepad.buttons[9]?.pressed || gamepad.buttons[8]?.pressed; // Start / Select

      if (dpadUp) {
        moveFocus2D("up");
        triggered = true;
      } else if (dpadDown) {
        moveFocus2D("down");
        triggered = true;
      } else if (dpadLeft) {
        moveFocus2D("left");
        triggered = true;
      } else if (dpadRight) {
        moveFocus2D("right");
        triggered = true;
      } else if (btnA) {
        activateCurrent();
        triggered = true;
      } else if (btnB) {
        if (onBack) {
          onBack();
        } else if (onToggleMenu) {
          onToggleMenu();
        } else {
          onExit();
        }
        triggered = true;
      } else if (btnMenu) {
        if (onToggleMenu) onToggleMenu();
        triggered = true;
      }

      if (triggered) {
        lastActionAt.current = now;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const pollId = window.setInterval(pollGamepad, GAMEPAD_POLL_INTERVAL_MS);

    // Auto-focus the first element when entering
    const elements = focusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.clearInterval(pollId);
    };
  }, [enabled, onExit, onToggleMenu, onBack]);
}
