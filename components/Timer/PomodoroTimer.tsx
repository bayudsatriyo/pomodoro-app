"use client";

import { useEffect, useRef } from "react";
import { useTimerStore } from "@/store/timer-store";
import { config } from "@/config";
import { soundManager } from "@/lib/sound";
import { createSession, updateSession } from "@/lib/storage";

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
    soundManager.playSessionComplete();
    setStatus("idle");

    if (sessionType === "work") {
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
        (sessionCount + 1) % config.app.sessionsUntilLongBreak === 0
          ? "longBreak"
          : "shortBreak";

      setSessionType(nextBreakType);
      const breakDuration =
        nextBreakType === "longBreak"
          ? config.app.longBreakDuration
          : config.app.shortBreakDuration;
      setTimeRemaining(breakDuration); // Already in seconds
    } else {
      // End break
      soundManager.playBreakEnd();
      setSessionType("work");
      setTimeRemaining(config.app.workDuration); // Already in seconds
    }
  };

  const handleStart = () => {
    if (sessionType === "work" && status === "idle") {
      // Create new session in localStorage
      const session = createSession(new Date().toISOString());
      setCurrentSessionId(session.id);
    }

    setStatus("running");
    workerRef.current?.postMessage({ action: "start", time: timeRemaining });
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
        ? config.app.workDuration
        : sessionType === "shortBreak"
        ? config.app.shortBreakDuration
        : config.app.longBreakDuration;

    setTimeRemaining(duration); // Already in seconds
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
      ? config.app.workDuration
      : sessionType === "shortBreak"
      ? config.app.shortBreakDuration
      : config.app.longBreakDuration;
  const progress = ((totalDuration - timeRemaining) / totalDuration) * 100;

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
      </div>

      {/* Session Count */}
      {sessionType === "work" && (
        <div className="session-count">Session {sessionCount + 1}</div>
      )}
    </div>
  );
}
