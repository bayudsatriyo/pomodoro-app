"use client";

import { useEffect, useRef } from "react";
import { useHealthStore } from "@/store/health-store";
import { useTimerStore, type TimerStatus } from "@/store/timer-store";
import { createHealthEvent } from "@/lib/storage";
import { soundManager } from "@/lib/sound";
import { usePomodoroSettingsStore } from "@/store/pomodoro-settings-store";

export default function HealthScheduler() {
  const {
    addActiveReminder,
    lastHydrationReminder,
    lastStretchReminder,
    setLastHydrationReminder,
    setLastStretchReminder,
  } = useHealthStore();
  const { status, timeRemaining, sessionType } = useTimerStore();
  const { settings } = usePomodoroSettingsStore();
  const previousStatusRef = useRef<TimerStatus>("idle");
  const previousSessionTypeRef = useRef(sessionType);
  const breakTriggeredRef = useRef(false);

  useEffect(() => {
    const wasRunning = previousStatusRef.current === "running";
    const isRunning = status === "running";

    if (isRunning && !wasRunning) {
      const now = Date.now();
      setLastHydrationReminder(now);
      setLastStretchReminder(now);
      breakTriggeredRef.current = false;
      previousStatusRef.current = status;
      previousSessionTypeRef.current = sessionType;
      return;
    }

    if (
      !isRunning &&
      wasRunning &&
      previousSessionTypeRef.current === "work" &&
      !breakTriggeredRef.current
    ) {
      triggerBreakReminder();
      breakTriggeredRef.current = true;
    }

    previousStatusRef.current = status;
    previousSessionTypeRef.current = sessionType;

    if (status !== "running" || sessionType !== "work") {
      return;
    }

    if (!lastHydrationReminder || !lastStretchReminder) {
      return;
    }

    const now = Date.now();

    if (now - lastHydrationReminder >= settings.hydrationReminderInterval * 1000) {
      triggerHydrationReminder();
      setLastHydrationReminder(now);
    }

    if (now - lastStretchReminder >= settings.stretchReminderInterval * 1000) {
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
    settings.hydrationReminderInterval,
    settings.stretchReminderInterval,
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

  const triggerBreakReminder = () => {
    const message =
      "Waktunya istirahat. Berdiri sebentar, tarik napas 3 kali, lalu jalan 1-2 menit biar fokus balik.";

    const healthEvent = createHealthEvent("break", message);

    addActiveReminder({
      id: healthEvent.id,
      type: "break",
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
