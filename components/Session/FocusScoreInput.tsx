"use client";

import { useState } from "react";
import { updateSession } from "@/lib/storage";

interface FocusScoreInputProps {
  sessionId: string;
  onClose: () => void;
}

export default function FocusScoreInput({
  sessionId,
  onClose,
}: FocusScoreInputProps) {
  const [focusScore, setFocusScore] = useState(5);
  const [notes, setNotes] = useState("");
  const [reflectionQuestion, setReflectionQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get AI reflection question on mount
  useState(() => {
    fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "reflection" }),
    })
      .then((res) => res.json())
      .then((data) => setReflectionQuestion(data.message))
      .catch(() => setReflectionQuestion("How was your focus this session?"));
  });

  const handleSubmit = () => {
    setIsLoading(true);

    try {
      updateSession(sessionId, {
        focusScore,
        notes: notes || undefined,
      });

      onClose();
    } catch (error) {
      console.error("Failed to save focus score:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Session Complete</h2>

        {reflectionQuestion && (
          <p className="reflection-question">{reflectionQuestion}</p>
        )}

        <div className="focus-score-section">
          <label className="label">Focus Score: {focusScore}/10</label>
          <input
            type="range"
            min="1"
            max="10"
            value={focusScore}
            onChange={(e) => setFocusScore(parseInt(e.target.value))}
            className="focus-slider"
          />
          <div className="score-labels">
            <span>Distracted</span>
            <span>Focused</span>
          </div>
        </div>

        <div className="notes-section">
          <label className="label">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What blocked you? What went well?"
            className="notes-textarea"
            rows={3}
          />
        </div>

        <div className="modal-actions">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? "SAVING..." : "SAVE"}
          </button>
          <button onClick={onClose} className="btn-tertiary">
            SKIP
          </button>
        </div>
      </div>
    </div>
  );
}
