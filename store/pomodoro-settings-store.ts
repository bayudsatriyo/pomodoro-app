import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { config } from "@/config";

export interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  postureCheckInterval: number;
  hydrationReminderInterval: number;
  stretchReminderInterval: number;
}

interface PomodoroSettingsState {
  settings: PomodoroSettings;
  setSettings: (updates: Partial<PomodoroSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: PomodoroSettings = {
  workDuration: config.app.workDuration,
  shortBreakDuration: config.app.shortBreakDuration,
  longBreakDuration: config.app.longBreakDuration,
  sessionsUntilLongBreak: config.app.sessionsUntilLongBreak,
  postureCheckInterval: config.app.postureCheckInterval,
  hydrationReminderInterval: config.app.hydrationReminderInterval,
  stretchReminderInterval: config.app.stretchReminderInterval,
};

export const usePomodoroSettingsStore = create<PomodoroSettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      setSettings: (updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...updates,
          },
        })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: "pomodoro_settings",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
