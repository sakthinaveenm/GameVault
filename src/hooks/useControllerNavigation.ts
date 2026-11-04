import { useEffect, useRef } from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useControllerStore } from '@/stores/controllerStore';
import { ControllerInfo } from '@/types';

export function useControllerNavigation() {
  const { nextTab, prevTab, toggleFullscreen, quickMenuOpen, setQuickMenuOpen } = useNavigationStore();
  const { setConnectedControllers } = useControllerStore();

  const lastInputTime = useRef<number>(0);
  const prevButtonStates = useRef<boolean[]>([]);

  // 1. Listen for standard Gamepad events
  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      const gp = e.gamepad;
      let type: ControllerInfo['type'] = 'generic';
      const idLower = gp.id.toLowerCase();
      if (idLower.includes('xbox') || idLower.includes('xinput')) {
        type = 'xbox';
      } else if (idLower.includes('playstation') || idLower.includes('dualsense') || idLower.includes('dualshock')) {
        type = 'playstation';
      } else if (idLower.includes('nintendo') || idLower.includes('pro controller')) {
        type = 'nintendo';
      }

      const info: ControllerInfo = {
        index: gp.index,
        id: gp.id,
        connected: true,
        type,
      };

      setConnectedControllers([info]);
    };

    const handleGamepadDisconnected = () => {
      setConnectedControllers([]);
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
    };
  }, [setConnectedControllers]);

  // 2. Poll Gamepad Input via requestAnimationFrame with dead-zone & debouncing
  useEffect(() => {
    let animId: number;

    const pollGamepads = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0]; // primary controller

      if (gp && gp.connected) {
        const now = Date.now();
        const debounceThreshold = 180; // ms between continuous inputs

        const buttonPressed = (btnIndex: number) => {
          return gp.buttons[btnIndex] && gp.buttons[btnIndex].pressed;
        };

        const justPressed = (btnIndex: number) => {
          const isPressed = buttonPressed(btnIndex);
          const wasPressed = prevButtonStates.current[btnIndex] || false;
          return isPressed && !wasPressed;
        };

        // LB (Button 4) -> Previous Tab
        if (justPressed(4)) {
          prevTab();
        }
        // RB (Button 5) -> Next Tab
        if (justPressed(5)) {
          nextTab();
        }
        // Start (Button 9) -> Quick Menu
        if (justPressed(9)) {
          setQuickMenuOpen(!quickMenuOpen);
        }

        // D-Pad navigation (Buttons 12: Up, 13: Down, 14: Left, 15: Right)
        // or Left Stick (Axes 0: X, 1: Y)
        const deadzone = 0.45;
        const axisX = gp.axes[0] || 0;
        const axisY = gp.axes[1] || 0;

        const isNavLeft = buttonPressed(14) || axisX < -deadzone;
        const isNavRight = buttonPressed(15) || axisX > deadzone;
        const isNavUp = buttonPressed(12) || axisY < -deadzone;
        const isNavDown = buttonPressed(13) || axisY > deadzone;

        if (now - lastInputTime.current > debounceThreshold) {
          if (isNavLeft || isNavRight || isNavUp || isNavDown) {
            // Virtual Focus Shifting
            const focusableElements = Array.from(
              document.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [tabindex="0"]:not([disabled]), input:not([disabled]), a[href]'
              )
            ).filter((el) => el.offsetParent !== null); // visible elements only

            const active = document.activeElement as HTMLElement | null;
            const currentIndex = active ? focusableElements.indexOf(active) : -1;

            if (focusableElements.length > 0) {
              let nextIndex = 0;
              if (currentIndex >= 0) {
                if (isNavRight || isNavDown) {
                  nextIndex = (currentIndex + 1) % focusableElements.length;
                } else if (isNavLeft || isNavUp) {
                  nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
                }
              }
              focusableElements[nextIndex].focus();
              lastInputTime.current = now;
            }
          }
        }

        // A Button (Button 0) -> Click focused element
        if (justPressed(0)) {
          const active = document.activeElement as HTMLElement | null;
          if (active && typeof active.click === 'function') {
            active.click();
          }
        }

        // B Button (Button 1) -> Dismiss modal / Back
        if (justPressed(1)) {
          if (quickMenuOpen) {
            setQuickMenuOpen(false);
          }
        }

        // Save button states for edge triggering
        prevButtonStates.current = gp.buttons.map((b) => b.pressed);
      }

      animId = requestAnimationFrame(pollGamepads);
    };

    animId = requestAnimationFrame(pollGamepads);
    return () => cancelAnimationFrame(animId);
  }, [nextTab, prevTab, quickMenuOpen, setQuickMenuOpen]);

  // 3. Seamless Keyboard Navigation Fallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'q' || e.key === 'PageUp') {
        prevTab();
      } else if (e.key === 'e' || e.key === 'PageDown') {
        nextTab();
      } else if (e.key === 'Escape') {
        if (quickMenuOpen) {
          setQuickMenuOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextTab, prevTab, quickMenuOpen, setQuickMenuOpen, toggleFullscreen]);
}

