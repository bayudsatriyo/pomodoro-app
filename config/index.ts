export const config = {
  glm: {
    apiKey: process.env.GLM_API_KEY || "",
    baseUrl: process.env.GLM_BASE_URL || "https://api.z.ai/api/coding/paas/v4",
  },
  gcs: {
    projectId: process.env.GCS_PROJECT_ID || "",
    bucketName: process.env.GCS_BUCKET_NAME || "",
    publicUrl: process.env.GCS_PUBLIC_URL || "https://storage.googleapis.com",
    credentials: process.env.GCS_CREDENTIALS || "",
  },
  app: {
    // TESTING MODE: All values in SECONDS for quick testing
    // For production, change to minutes and multiply by 60 in components

    // Timer defaults (in SECONDS)
    workDuration: 20, // 20 seconds for testing
    shortBreakDuration: 10, // 10 seconds
    longBreakDuration: 15, // 15 seconds
    sessionsUntilLongBreak: 4,

    // Health reminder intervals (in SECONDS)
    postureReminderInterval: 30, // 30 seconds (DISABLED in HealthScheduler)
    hydrationReminderInterval: 30, // 30 seconds
    stretchReminderInterval: 30, // 30 seconds

    // Posture check settings (vision-based)
    postureCheckInterval: 5, // 5 seconds for testing - triggers at 5s mark
    postureCheckEnabled: true, // Enable/disable posture checking

    // Debug mode
    debugKeepGcsFiles: process.env.DEBUG_KEEP_GCS_FILES === "true", // Keep uploaded images in GCS for debugging
  },
};

// Validation helper
export function validateConfig() {
  const missing: string[] = [];

  if (!config.glm.apiKey) missing.push("GLM_API_KEY");
  if (!config.glm.baseUrl) missing.push("GLM_BASE_URL");

  return {
    valid: missing.length === 0,
    missing,
  };
}

// GCS-specific validation
export function validateGcsConfig() {
  const missing: string[] = [];

  if (!config.gcs.projectId) missing.push("GCS_PROJECT_ID");
  if (!config.gcs.bucketName) missing.push("GCS_BUCKET_NAME");
  if (!config.gcs.credentials) missing.push("GCS_CREDENTIALS");

  return {
    valid: missing.length === 0,
    missing,
  };
}
