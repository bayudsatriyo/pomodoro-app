import { Storage } from "@google-cloud/storage";
import { config } from "@/config";

let storage: Storage | null = null;

function normalizeJsonEnv(value: string): string {
  let normalized = value.trim();
  const quoteChars = ["'", '"', "`"];

  let trimmed = true;
  while (trimmed) {
    trimmed = false;
    for (const quote of quoteChars) {
      if (normalized.startsWith(quote)) {
        normalized = normalized.slice(1).trim();
        trimmed = true;
      }
      if (normalized.endsWith(quote)) {
        normalized = normalized.slice(0, -1).trim();
        trimmed = true;
      }
    }
  }

  return normalized;
}

function extractJson(input: string): string {
  const start = input.indexOf("{");
  const end = input.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    return input.slice(start, end + 1);
  }

  return input;
}

function parseJsonWithFallback(input: string) {
  const cleaned = normalizeJsonEnv(input);

  try {
    return JSON.parse(cleaned);
  } catch {
    const extracted = extractJson(cleaned);
    return JSON.parse(extracted);
  }
}

function parseCredentials(raw: string) {
  const normalized = normalizeJsonEnv(raw);

  // If it's JSON already
  if (normalized.startsWith("{") || normalized.includes("{\"type\"")) {
    return parseJsonWithFallback(normalized);
  }

  // Otherwise attempt base64 decode (common in CI)
  const decoded = Buffer.from(normalized, "base64").toString("utf8").trim();
  const decodedNormalized = normalizeJsonEnv(decoded);

  return parseJsonWithFallback(decodedNormalized);
}

// Initialize GCS client
function getStorageClient(): Storage {
  if (storage) return storage;

  try {
    if (!config.gcs.credentials) {
      throw new Error("Missing GCS_CREDENTIALS");
    }

    const credentials = parseCredentials(config.gcs.credentials);

    storage = new Storage({
      projectId: config.gcs.projectId,
      credentials,
    });
    return storage;
  } catch (error) {
    const raw = config.gcs.credentials ?? "";
    const normalized = normalizeJsonEnv(raw);
    const decodedAttempt = (() => {
      try {
        return Buffer.from(normalized, "base64").toString("utf8").trim();
      } catch {
        return "";
      }
    })();

    console.error("[GCS] Credentials debug", {
      rawLength: raw.length,
      rawStart: raw.slice(0, 3),
      rawEnd: raw.slice(-3),
      normalizedStart: normalized.slice(0, 3),
      normalizedEnd: normalized.slice(-3),
      normalizedHasJson: normalized.includes("{\"type\"") || normalized.trim().startsWith("{"),
      decodedLength: decodedAttempt.length,
      decodedStart: decodedAttempt.slice(0, 3),
      decodedEnd: decodedAttempt.slice(-3),
      decodedHasJson:
        decodedAttempt.includes("{\"type\"") || decodedAttempt.trim().startsWith("{"),
    });

    console.error("Failed to initialize GCS client:", error);
    throw new Error(
      "GCS client initialization failed. Ensure GCS_CREDENTIALS is valid JSON (or base64-encoded JSON) without extra quotes."
    );
  }
}

/**
 * Upload image blob to GCS
 * @param blob - Image blob
 * @param filename - Unique filename
 * @returns Public URL of uploaded file (using signed URL)
 */
export async function uploadImageToGCS(
  blob: Blob,
  filename: string
): Promise<string> {
  const client = getStorageClient();
  const bucket = client.bucket(config.gcs.bucketName);
  const file = bucket.file(`pomodoro/${filename}`);

  // Convert blob to buffer
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to GCS
  await file.save(buffer, {
    metadata: {
      contentType: blob.type,
      cacheControl: "public, max-age=3600",
    },
  });

  // Generate signed URL (valid for 15 minutes)
  // This is required when uniform bucket-level access is enabled
  const [signedUrl] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes from now
  });

  return signedUrl;
}

/**
 * Delete image from GCS
 * @param filename - Filename to delete
 */
export async function deleteImageFromGCS(filename: string): Promise<void> {
  try {
    const client = getStorageClient();
    const bucket = client.bucket(config.gcs.bucketName);
    const file = bucket.file(`pomodoro/${filename}`);

    await file.delete();
  } catch (error) {
    console.error("Failed to delete file from GCS:", error);
    // Don't throw - file might already be deleted or not exist
  }
}

/**
 * Generate unique filename for image
 */
export function generateImageFilename(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `posture-${timestamp}-${random}.jpg`;
}
