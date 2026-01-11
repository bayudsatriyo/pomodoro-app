import { create } from "zustand";
import { config } from "@/config";

export type TimerStatus = "idle" | "running" | "paused" | "break";
export type SessionType = "work" | "shortBreak" | "longBreak";

interface TimerState {
  // Timer state
  timeRemaining: number; // in seconds
  status: TimerStatus;
  sessionType: SessionType;
  sessionCount: number;
  currentSessionId: string | null;

  // Actions
  setTimeRemaining: (time: number) => void;
  setStatus: (status: TimerStatus) => void;
  setSessionType: (type: SessionType) => void;
  incrementSessionCount: () => void;
  setCurrentSessionId: (id: string | null) => void;
  reset: () => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  // Initial state
  timeRemaining: config.app.workDuration, // 10 seconds for testing
  status: "idle",
  sessionType: "work",
  sessionCount: 0,
  currentSessionId: null,

  // Actions
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setStatus: (status) => set({ status }),
  setSessionType: (type) => set({ sessionType: type }),
  incrementSessionCount: () =>
    set((state) => ({ sessionCount: state.sessionCount + 1 })),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  reset: () =>
    set({
      timeRemaining: config.app.workDuration, // 10 seconds for testing
      status: "idle",
      sessionType: "work",
      currentSessionId: null,
    }),
}));
