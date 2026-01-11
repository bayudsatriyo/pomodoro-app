"use client";

import { useEffect, useRef, useState } from "react";
import { useHealthStore } from "@/store/health-store";
import { useTimerStore } from "@/store/timer-store";

export default function CameraIndicator() {
  const { cameraStatus } = useHealthStore();
  const { status } = useTimerStore();
  const [showPreview, setShowPreview] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Show preview when capturing
  useEffect(() => {
    if (cameraStatus === "capturing") {
      setShowPreview(true);
      startCameraPreview();
    } else if (cameraStatus === "processing") {
      // Keep preview for a moment during processing
      const timeout = setTimeout(() => {
        setShowPreview(false);
        stopCameraPreview();
      }, 2000);
      return () => clearTimeout(timeout);
    } else {
      setShowPreview(false);
      stopCameraPreview();
    }
  }, [cameraStatus]);

  const startCameraPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("[CameraPreview] Error starting preview:", error);
    }
  };

  const stopCameraPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Don't show if timer is not running
  if (status !== "running") {
    return null;
  }

  const getStatusConfig = () => {
    switch (cameraStatus) {
      case "capturing":
        return {
          color: "#22c55e",
          text: "📸 Menganalisis postur...",
          pulse: true,
        };
      case "processing":
        return {
          color: "#3b82f6",
          text: "🤖 Memproses dengan AI...",
          pulse: true,
        };
      case "error":
        return {
          color: "#ef4444",
          text: "❌ Kamera error",
          pulse: false,
        };
      case "idle":
      default:
        return {
          color: "#6b7280",
          text: "📷 Postur monitor aktif",
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <>
      {/* Camera Preview (shows when capturing) */}
      {showPreview && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "20px",
            width: "200px",
            height: "150px",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            zIndex: 1000,
            border: "3px solid #22c55e",
            background: "#000",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)", // Mirror effect
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              left: "8px",
              right: "8px",
              padding: "4px 8px",
              background: "rgba(0,0,0,0.7)",
              borderRadius: "4px",
              color: "white",
              fontSize: "11px",
              textAlign: "center",
            }}
          >
            Kamera Aktif
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          background: "rgba(0, 0, 0, 0.8)",
          borderRadius: "24px",
          fontSize: "13px",
          color: "white",
          fontWeight: 500,
          zIndex: 1000,
          transition: "all 0.3s ease",
          border: cameraStatus === "capturing" ? "2px solid #22c55e" : "none",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: config.color,
            ...(config.pulse
              ? {
                  animation: "pulse 1s ease-in-out infinite",
                }
              : {}),
          }}
        />
        <span>{config.text}</span>
        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(1.3);
            }
          }
        `}</style>
      </div>
    </>
  );
}
