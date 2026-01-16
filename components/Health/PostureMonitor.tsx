"use client";

import { useEffect, useRef } from "react";
import { useTimerStore } from "@/store/timer-store";
import { useHealthStore } from "@/store/health-store";
import { config } from "@/config";
import { soundManager } from "@/lib/sound";
import { createHealthEvent } from "@/lib/storage";

export default function PostureMonitor() {
  const { status, timeRemaining, sessionType, currentSessionId } = useTimerStore();
  const { addActiveReminder, setCameraStatus } = useHealthStore();

  const hasCheckedRef = useRef(false); // Track if we've already checked
  const previousSessionIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ONE-TIME posture check per work session
  useEffect(() => {
    if (currentSessionId && currentSessionId !== previousSessionIdRef.current) {
      hasCheckedRef.current = false;
      previousSessionIdRef.current = currentSessionId;
    }

    if (
      !config.app.postureCheckEnabled ||
      status !== "running" ||
      sessionType !== "work"
    ) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const triggerTime = Math.max(
      config.app.workDuration - config.app.postureCheckInterval,
      0
    );

    if (timeRemaining === triggerTime && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      // Small delay to trigger check
      timeoutRef.current = setTimeout(() => {
        checkPosture();
      }, 100);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [status, timeRemaining, sessionType, currentSessionId]);

  /**
   * Capture image from camera (on-demand)
   * Camera starts, captures, then stops immediately
   */
  const captureImageOnDemand = async (): Promise<Blob | null> => {
    let stream: MediaStream | null = null;

    try {
      setCameraStatus("capturing");

      // 1. Start camera
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      // 2. Create video element
      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;

      // 3. Wait for video to be ready
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      // 4. Wait a bit for camera to adjust (exposure, focus)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 5. Capture frame to canvas
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Failed to get canvas context");
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 6. Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
      });

      return blob;
    } catch (error) {
      console.error("Camera capture error:", error);
      setCameraStatus("error");
      return null;
    } finally {
      // 7. ALWAYS stop camera
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const checkPosture = async () => {
    try {
      // 1. Capture image (camera starts and stops)
      const imageBlob = await captureImageOnDemand();
      if (!imageBlob) {
        console.error("[PostureMonitor] Failed to capture image");
        setCameraStatus("error");
        return;
      }

      setCameraStatus("processing");

      // 2. Send to API
      const formData = new FormData();
      formData.append("image", imageBlob, "posture.jpg");

      const response = await fetch("/api/posture/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "[PostureMonitor] API error:",
          response.status,
          errorText
        );
        setCameraStatus("error");
        return;
      }

      const data = await response.json();
      const { analysis, severity } = data;

      // 3. Log to localStorage
      const healthEvent = createHealthEvent("posture", analysis);

      // 4. Play sound based on severity
      if (severity === "bad") {
        soundManager.playPostureWarning();
      } else if (severity === "good") {
        soundManager.playPostureGood();
      }

      // 5. Show alert for ALL results (good, warning, bad)
      addActiveReminder({
        id: healthEvent.id,
        type: "posture",
        message: analysis,
        timestamp: Date.now(),
      });

      // SPEAK the result using Text-to-Speech for ALL results
      soundManager.speak(analysis);

      setCameraStatus("idle");
    } catch (error) {
      console.error("[PostureMonitor] Error:", error);
      setCameraStatus("error");
    }
  };

  // Hidden component - no UI
  return null;
}
