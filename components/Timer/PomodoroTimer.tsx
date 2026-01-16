"use client";

import { useEffect, useRef, useState } from "react";
import { useTimerStore } from "@/store/timer-store";
import { soundManager } from "@/lib/sound";
import { createSession, updateSession } from "@/lib/storage";
import { usePomodoroSettingsStore } from "@/store/pomodoro-settings-store";

export default function PomodoroTimer() {
  const {
    timeRemaining,
    status,
    sessionType,
    setTimeRemaining,
    setStatus,
    setSessionType,
    incrementSessionCount,
    sessionCount,
    setCurrentSessionId,
  } = useTimerStore();
  const { settings, setSettings } = usePomodoroSettingsStore();

  const workerRef = useRef<Worker | null>(null);

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker("/timer-worker.js");

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, timeRemaining: time } = e.data;

      if (type === "tick") {
        setTimeRemaining(time);
      } else if (type === "complete") {
        handleSessionComplete();
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleSessionComplete = () => {
    const { sessionType: currentType, sessionCount: currentCount } =
      useTimerStore.getState();

    setStatus("idle");

    if (currentType === "work") {
      soundManager.playSessionComplete();
      // End work session
      const sessionId = useTimerStore.getState().currentSessionId;
      if (sessionId) {
        updateSession(sessionId, {
          endTime: new Date().toISOString(),
        });
      }

      incrementSessionCount();

      // Determine next break type
      const nextBreakType =
        (currentCount + 1) % settings.sessionsUntilLongBreak === 0
          ? "longBreak"
          : "shortBreak";

      setSessionType(nextBreakType);
      const breakDuration =
        nextBreakType === "longBreak"
          ? settings.longBreakDuration
          : settings.shortBreakDuration;
      setTimeRemaining(breakDuration); // Already in seconds
      soundManager.playBreakEnd();
    } else {
      // End break -> back to work (manual start)
      soundManager.playSessionComplete();
      setSessionType("work");
      setTimeRemaining(settings.workDuration); // Already in seconds
      setCurrentSessionId(null);
    }
  };

  const handleStart = () => {
    if (sessionType === "work" && status === "idle") {
      // Create new session in localStorage
      const session = createSession(new Date().toISOString());
      setCurrentSessionId(session.id);
    }

    setStatus("running");
    workerRef.current?.postMessage({ action: "start", time: Math.max(timeRemaining, 1) });
  };

  const handlePause = () => {
    setStatus("paused");
    workerRef.current?.postMessage({ action: "pause" });
  };

  const handleReset = () => {
    setStatus("idle");
    workerRef.current?.postMessage({ action: "reset" });

    const duration =
      sessionType === "work"
        ? settings.workDuration
        : sessionType === "shortBreak"
        ? settings.shortBreakDuration
        : settings.longBreakDuration;

    setTimeRemaining(duration); // Already in seconds
    setCurrentSessionId(null);
  };

  const handleSkip = () => {
    workerRef.current?.postMessage({ action: "reset" });
    handleSessionComplete();
  };

  // Format time display
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const displayTime = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  // Calculate progress percentage
  const totalDuration =
    sessionType === "work"
      ? settings.workDuration
      : sessionType === "shortBreak"
      ? settings.shortBreakDuration
      : settings.longBreakDuration;
  const progress = ((totalDuration - timeRemaining) / totalDuration) * 100;

  const isDevelopment = process.env.NODE_ENV === "development";
  const minimumSeconds = isDevelopment ? 1 : 60;
  const minutePrecision = isDevelopment ? 2 : 0;
  const minuteStep = isDevelopment ? 0.01 : 1;
  const minuteMinimum = isDevelopment ? 0.1 : 1;

  const toMinutes = (seconds: number) =>
    Number((seconds / 60).toFixed(minutePrecision));

  const updateSetting = (key: keyof typeof settings, value: number) => {
    const safeValue = Number.isFinite(value) ? value : 1;

    if (key === "sessionsUntilLongBreak") {
      setSettings({ [key]: Math.max(1, Math.round(safeValue)) });
      return;
    }

    const rawSeconds = Math.round(safeValue * 60);
    const nextValue = Math.max(minimumSeconds, rawSeconds);

    setSettings({ [key]: nextValue });

    if (status === "idle") {
      const duration =
        sessionType === "work"
          ? key === "workDuration"
            ? nextValue
            : settings.workDuration
          : sessionType === "shortBreak"
          ? key === "shortBreakDuration"
            ? nextValue
            : settings.shortBreakDuration
          : key === "longBreakDuration"
          ? nextValue
          : settings.longBreakDuration;

      setTimeRemaining(duration);
    }
  };

  useEffect(() => {
    if (status !== "idle") {
      return;
    }

    const duration =
      sessionType === "work"
        ? settings.workDuration
        : sessionType === "shortBreak"
        ? settings.shortBreakDuration
        : settings.longBreakDuration;

    setTimeRemaining(duration);
  }, [
    sessionType,
    status,
    setTimeRemaining,
    settings.workDuration,
    settings.shortBreakDuration,
    settings.longBreakDuration,
  ]);

  const workMinutes = toMinutes(settings.workDuration);
  const shortBreakMinutes = toMinutes(settings.shortBreakDuration);
  const longBreakMinutes = toMinutes(settings.longBreakDuration);
  const postureMinutes = toMinutes(settings.postureCheckInterval);
  const hydrationMinutes = toMinutes(settings.hydrationReminderInterval);
  const stretchMinutes = toMinutes(settings.stretchReminderInterval);

  type DraftSettings = {
    workDuration: number | string;
    shortBreakDuration: number | string;
    longBreakDuration: number | string;
    sessionsUntilLongBreak: number | string;
    postureCheckInterval: number | string;
    hydrationReminderInterval: number | string;
    stretchReminderInterval: number | string;
  };

  const [draftSettings, setDraftSettings] = useState<DraftSettings>({
    workDuration: workMinutes,
    shortBreakDuration: shortBreakMinutes,
    longBreakDuration: longBreakMinutes,
    sessionsUntilLongBreak: settings.sessionsUntilLongBreak,
    postureCheckInterval: postureMinutes,
    hydrationReminderInterval: hydrationMinutes,
    stretchReminderInterval: stretchMinutes,
  });

  useEffect(() => {
    setDraftSettings({
      workDuration: workMinutes,
      shortBreakDuration: shortBreakMinutes,
      longBreakDuration: longBreakMinutes,
      sessionsUntilLongBreak: settings.sessionsUntilLongBreak,
      postureCheckInterval: postureMinutes,
      hydrationReminderInterval: hydrationMinutes,
      stretchReminderInterval: stretchMinutes,
    });
  }, [
    workMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    postureMinutes,
    hydrationMinutes,
    stretchMinutes,
    settings.sessionsUntilLongBreak,
  ]);

  const handleDraftChange = (key: keyof DraftSettings, value: string) => {
    if (value === "") {
      setDraftSettings((prev) => ({
        ...prev,
        [key]: "",
      }));
      return;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    setDraftSettings((prev) => ({
      ...prev,
      [key]: parsed,
    }));
  };

  const commitDraft = (key: keyof DraftSettings, value: string | number) => {
    if (value === "") {
      setDraftSettings((prev) => ({
        ...prev,
        [key]: key === "sessionsUntilLongBreak"
          ? settings.sessionsUntilLongBreak
          : toMinutes(settings[key as keyof typeof settings] as number),
      }));
      return;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      setDraftSettings((prev) => ({
        ...prev,
        [key]: key === "sessionsUntilLongBreak"
          ? settings.sessionsUntilLongBreak
          : toMinutes(settings[key as keyof typeof settings] as number),
      }));
      return;
    }

    updateSetting(key as keyof typeof settings, parsed);
  };

  return (
    <div className="timer-container">
      {/* Session Type Indicator */}
      <div className="session-type">
        {sessionType === "work"
          ? "FOCUS SESSION"
          : sessionType === "shortBreak"
          ? "SHORT BREAK"
          : "LONG BREAK"}
      </div>

      {/* Timer Display with Progress Ring */}
      <div className="timer-display">
        <svg className="progress-ring" width="320" height="320">
          <circle
            className="progress-ring-bg"
            cx="160"
            cy="160"
            r="150"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
          />
          <circle
            className="progress-ring-fill"
            cx="160"
            cy="160"
            r="150"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 150}`}
            strokeDashoffset={`${2 * Math.PI * 150 * (1 - progress / 100)}`}
            transform="rotate(-90 160 160)"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="time-text">{displayTime}</div>
      </div>

      {/* Controls */}
      <div className="timer-controls">
        {status === "idle" || status === "paused" ? (
          <button onClick={handleStart} className="btn-primary">
            {status === "paused" ? "RESUME" : "START"}
          </button>
        ) : (
          <button onClick={handlePause} className="btn-secondary">
            PAUSE
          </button>
        )}
        <button onClick={handleReset} className="btn-tertiary">
          RESET
        </button>
        <button onClick={handleSkip} className="btn-tertiary">
          {sessionType === "work" ? "SKIP WORK" : "SKIP BREAK"}
        </button>
      </div>

      <div className="timer-settings">
        <div className="timer-settings-title">Settings</div>
        <div className="timer-settings-grid">
          <label className="timer-setting">
            <span>Work (min)</span>
            <input
              type="number"
              min={minuteMinimum}
              step={minuteStep}
              value={draftSettings.workDuration}
              onChange={(event) =>
                handleDraftChange("workDuration", event.target.value)
              }
              onBlur={(event) =>
                commitDraft("workDuration", event.target.value)
              }
              className="timer-setting-input"
            />
          </label>
          <label className="timer-setting">
            <span>Short Break (min)</span>
            <input
              type="number"
              min={minuteMinimum}
              step={minuteStep}
              value={draftSettings.shortBreakDuration}
              onChange={(event) =>
                handleDraftChange("shortBreakDuration", event.target.value)
              }
              onBlur={(event) =>
                commitDraft("shortBreakDuration", event.target.value)
              }
              className="timer-setting-input"
            />
          </label>
          <label className="timer-setting">
            <span>Long Break (min)</span>
            <input
              type="number"
              min={minuteMinimum}
              step={minuteStep}
              value={draftSettings.longBreakDuration}
              onChange={(event) =>
                handleDraftChange("longBreakDuration", event.target.value)
              }
              onBlur={(event) =>
                commitDraft("longBreakDuration", event.target.value)
              }
              className="timer-setting-input"
            />
          </label>
          <label className="timer-setting">
            <span>Long Break Every</span>
            <input
              type="number"
              min={1}
              step={1}
              value={draftSettings.sessionsUntilLongBreak}
              onChange={(event) =>
                handleDraftChange("sessionsUntilLongBreak", event.target.value)
              }
              onBlur={(event) =>
                commitDraft("sessionsUntilLongBreak", event.target.value)
              }
              className="timer-setting-input"
            />
          </label>
          <label className="timer-setting">
            <span>Posture Check (min)</span>
            <input
              type="number"
              min={minuteMinimum}
              step={minuteStep}
              value={draftSettings.postureCheckInterval}
              onChange={(event) =>
                handleDraftChange("postureCheckInterval", event.target.value)
              }
              onBlur={(event) =>
                commitDraft("postureCheckInterval", event.target.value)
              }
              className="timer-setting-input"
            />
          </label>
          <label className="timer-setting">
            <span>Hydration (min)</span>
            <input
              type="number"
              min={minuteMinimum}
              step={minuteStep}
              value={draftSettings.hydrationReminderInterval}
              onChange={(event) =>
                handleDraftChange("hydrationReminderInterval", event.target.value)
              }
              onBlur={(event) =>
                commitDraft("hydrationReminderInterval", event.target.value)
              }
              className="timer-setting-input"
            />
          </label>
          <label className="timer-setting">
            <span>Stretch (min)</span>
            <input
              type="number"
              min={minuteMinimum}
              step={minuteStep}
              value={draftSettings.stretchReminderInterval}
              onChange={(event) =>
                handleDraftChange("stretchReminderInterval", event.target.value)
              }
              onBlur={(event) =>
                commitDraft("stretchReminderInterval", event.target.value)
              }
              className="timer-setting-input"
            />
          </label>
        </div>
      </div>

      {/* Session Count */}
      {sessionType === "work" && (
        <div className="session-count">Session {sessionCount + 1}</div>
      )}
    </div>
  );
}

