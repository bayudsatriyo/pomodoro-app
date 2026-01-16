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
    // PRODUCTION MODE: All values in SECONDS
    // (minutes × 60) for human-friendly durations

    // Timer defaults (in SECONDS)
    workDuration: 25 * 60, // 25 minutes
    shortBreakDuration: 5 * 60, // 5 minutes
    longBreakDuration: 15 * 60, // 15 minutes
    sessionsUntilLongBreak: 4,

    // Health reminder intervals (in SECONDS)
    postureReminderInterval: 10 * 60, // 10 minutes
    hydrationReminderInterval: 30 * 60, // 30 minutes
    stretchReminderInterval: 60 * 60, // 60 minutes

    // Posture check settings (vision-based)
    postureCheckInterval: 10 * 60, // 10 minutes after session start
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
