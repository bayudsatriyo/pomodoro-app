"use client";

import { useEffect, useRef } from "react";
import { useHealthStore } from "@/store/health-store";
import { useTimerStore } from "@/store/timer-store";
import { createHealthEvent } from "@/lib/storage";
import { soundManager } from "@/lib/sound";

export default function HealthScheduler() {
  const { addActiveReminder } = useHealthStore();
  const { status, timeRemaining } = useTimerStore();

  const hydrationTriggeredRef = useRef(false);
  const stretchTriggeredRef = useRef(false);

  useEffect(() => {
    // Reset triggers when timer starts
    if (status === "running") {
      hydrationTriggeredRef.current = false;
      stretchTriggeredRef.current = false;
    }

    // Only process if running
    if (status !== "running") {
      return;
    }

    // Trigger hydration reminder at 10 seconds remaining
    if (timeRemaining === 10 && !hydrationTriggeredRef.current) {
      hydrationTriggeredRef.current = true;
      triggerHydrationReminder();
    }

    // Trigger stretch reminder at 0 seconds (timer complete)
    if (timeRemaining === 0 && !stretchTriggeredRef.current) {
      stretchTriggeredRef.current = true;
      triggerStretchReminder();
    }
  }, [status, timeRemaining]);

  const triggerHydrationReminder = () => {
    const message = "Jangan lupa minum air! Hydration itu penting biar tetap fokus.";

    const healthEvent = createHealthEvent("hydration", message);

    addActiveReminder({
      id: healthEvent.id,
      type: "hydration",
      message,
      timestamp: Date.now(),
    });

    // Play sound notification and speak
    soundManager.playNotification();
    soundManager.speak(message);
  };

  const triggerStretchReminder = () => {
    const message = "Waktunya stretching! Berdiri dan regangkan tubuh kamu biar fresh lagi.";

    const healthEvent = createHealthEvent("stretch", message);

    addActiveReminder({
      id: healthEvent.id,
      type: "stretch",
      message,
      timestamp: Date.now(),
    });

    // Play sound notification and speak
    soundManager.playNotification();
    soundManager.speak(message);
  };

  // Hidden component - no UI
  return null;
}
