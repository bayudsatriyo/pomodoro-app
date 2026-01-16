"use client";

import { useEffect } from "react";
import { useHealthStore, type HealthReminder } from "@/store/health-store";
import { soundManager } from "@/lib/sound";
import { acknowledgeHealthEvent } from "@/lib/storage";

export default function NotificationAlert() {
  const { activeReminders, removeActiveReminder } = useHealthStore();

  const handleAcknowledge = (reminder: HealthReminder) => {
    // Log acknowledgment to localStorage
    acknowledgeHealthEvent(reminder.id);
    removeActiveReminder(reminder.id);
  };

  const handleDismiss = (id: string) => {
    removeActiveReminder(id);
  };

  // Play sound when new reminder is added
  useEffect(() => {
    if (activeReminders.length > 0) {
      const latestReminder = activeReminders[activeReminders.length - 1];
      if (latestReminder.type !== "posture" && !soundManager.isPosturePriorityActive()) {
        soundManager.playNotification();
      }
    }
  }, [activeReminders.length]);

  if (activeReminders.length === 0) return null;

  return (
    <>
      {activeReminders.map((reminder, index) => (
        <div
          key={reminder.id}
          className="notification-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000 + index,
          }}
        >
          <div
            className="notification-alert"
            style={{
              position: "relative",
              backgroundColor: "#1a1a1a",
              color: "#fff",
              borderRadius: "12px",
              padding: "24px",
              minWidth: "320px",
              maxWidth: "420px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
              border: `2px solid ${
                reminder.type === "posture"
                  ? "#ef4444"
                  : reminder.type === "hydration"
                  ? "#3b82f6"
                  : "#22c55e"
              }`,
            }}
          >
            <div className="notification-icon" style={{ fontSize: "32px", marginBottom: "12px" }}>
              {reminder.type === "posture" && "🧘"}
              {reminder.type === "hydration" && "💧"}
              {reminder.type === "stretch" && "🤸"}
            </div>

            <div className="notification-content">
              <div
                className="notification-type"
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  opacity: 0.7,
                  marginBottom: "8px",
                  color:
                    reminder.type === "posture"
                      ? "#ef4444"
                      : reminder.type === "hydration"
                      ? "#3b82f6"
                      : "#22c55e",
                }}
              >
                {reminder.type.toUpperCase()}
              </div>
              <div
                className="notification-message"
                style={{ fontSize: "16px", lineHeight: "1.5" }}
              >
                {reminder.message}
              </div>
            </div>

            <div className="notification-actions" style={{ marginTop: "20px", display: "flex", gap: "8px" }}>
              <button
                onClick={() => handleAcknowledge(reminder)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor:
                    reminder.type === "posture"
                      ? "#ef4444"
                      : reminder.type === "hydration"
                      ? "#3b82f6"
                      : "#22c55e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                DONE
              </button>
              <button
                onClick={() => handleDismiss(reminder.id)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#374151",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
