"use client";

import { useEffect } from "react";
import { useHealthStore } from "@/store/health-store";
import { config } from "@/config";

const STORAGE_KEY = "pomodoro_camera_permission_requested";

export default function CameraPermissionRequest() {
  const { setCameraStatus } = useHealthStore();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!config.app.postureCheckEnabled) {
      return;
    }

    if (localStorage.getItem(STORAGE_KEY) === "true") {
      return;
    }

    localStorage.setItem(STORAGE_KEY, "true");

    const requestPermission = async () => {
      try {
        setCameraStatus("capturing");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });

        stream.getTracks().forEach((track) => track.stop());
        setCameraStatus("idle");
      } catch (error) {
        console.error("[CameraPermission] Permission denied:", error);
        setCameraStatus("error");
      }
    };

    requestPermission();
  }, [setCameraStatus]);

  return null;
}
