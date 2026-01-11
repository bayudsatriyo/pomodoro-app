import { create } from "zustand";

export interface HealthReminder {
  id: string;
  type: "posture" | "hydration" | "stretch";
  message: string;
  timestamp: number;
}

interface HealthState {
  // State
  lastPostureReminder: number | null;
  lastHydrationReminder: number | null;
  lastStretchReminder: number | null;
  activeReminder: HealthReminder | null;
  activeReminders: HealthReminder[]; // NEW: Multiple stacked reminders
  reminderQueue: HealthReminder[];
  cameraStatus: "idle" | "capturing" | "error" | "processing";

  // Actions
  setLastPostureReminder: (time: number) => void;
  setLastHydrationReminder: (time: number) => void;
  setLastStretchReminder: (time: number) => void;
  setActiveReminder: (reminder: HealthReminder | null) => void;
  addActiveReminder: (reminder: HealthReminder) => void; // NEW: Add to active reminders
  removeActiveReminder: (id: string) => void; // NEW: Remove specific reminder
  setCameraStatus: (status: "idle" | "capturing" | "error" | "processing") => void;
  addToQueue: (reminder: HealthReminder) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  // Initial state
  lastPostureReminder: null,
  lastHydrationReminder: null,
  lastStretchReminder: null,
  activeReminder: null,
  activeReminders: [], // NEW: Multiple stacked reminders
  reminderQueue: [],
  cameraStatus: "idle",

  // Actions
  setLastPostureReminder: (time) => set({ lastPostureReminder: time }),
  setLastHydrationReminder: (time) => set({ lastHydrationReminder: time }),
  setLastStretchReminder: (time) => set({ lastStretchReminder: time }),
  setActiveReminder: (reminder) => set({ activeReminder: reminder }),
  addActiveReminder: (reminder) =>
    set((state) => ({
      activeReminders: [...state.activeReminders, reminder],
    })),
  removeActiveReminder: (id) =>
    set((state) => ({
      activeReminders: state.activeReminders.filter((r) => r.id !== id),
    })),
  setCameraStatus: (status) => set({ cameraStatus: status }),
  addToQueue: (reminder) =>
    set((state) => ({
      reminderQueue: [...state.reminderQueue, reminder],
    })),
  removeFromQueue: (id) =>
    set((state) => ({
      reminderQueue: state.reminderQueue.filter((r) => r.id !== id),
    })),
  clearQueue: () => set({ reminderQueue: [] }),
}));
