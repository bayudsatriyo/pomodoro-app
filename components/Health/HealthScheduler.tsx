"use client";

import { useEffect, useRef } from "react";
import { useHealthStore } from "@/store/health-store";
import { useTimerStore } from "@/store/timer-store";
import { createHealthEvent } from "@/lib/storage";
import { soundManager } from "@/lib/sound";
import { config } from "@/config";

export default function HealthScheduler() {
  const {
    addActiveReminder,
    lastHydrationReminder,
    lastStretchReminder,
    setLastHydrationReminder,
    setLastStretchReminder,
  } = useHealthStore();
  const { status, timeRemaining, sessionType } = useTimerStore();

  useEffect(() => {
    if (status !== "running" || sessionType !== "work") {
      return;
    }

    const now = Date.now();

    if (!lastHydrationReminder) {
      setLastHydrationReminder(now);
    }

    if (!lastStretchReminder) {
      setLastStretchReminder(now);
    }

    if (
      lastHydrationReminder &&
      now - lastHydrationReminder >= config.app.hydrationReminderInterval * 1000
    ) {
      triggerHydrationReminder();
      setLastHydrationReminder(now);
    }

    if (
      lastStretchReminder &&
      now - lastStretchReminder >= config.app.stretchReminderInterval * 1000
    ) {
      triggerStretchReminder();
      setLastStretchReminder(now);
    }
  }, [
    status,
    timeRemaining,
    sessionType,
    lastHydrationReminder,
    lastStretchReminder,
    setLastHydrationReminder,
    setLastStretchReminder,
  ]);

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
    if (!soundManager.isPosturePriorityActive()) {
      soundManager.playNotification();
      soundManager.speak(message);
    }
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
    if (!soundManager.isPosturePriorityActive()) {
      soundManager.playNotification();
      soundManager.speak(message);
    }
  };

  // Hidden component - no UI
  return null;
}
