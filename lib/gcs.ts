import { Storage } from "@google-cloud/storage";
import { config } from "@/config";

let storage: Storage | null = null;

// Initialize GCS client
function getStorageClient(): Storage {
  if (storage) return storage;

  try {
    const credentials = JSON.parse(config.gcs.credentials);
    storage = new Storage({
      projectId: config.gcs.projectId,
      credentials,
    });
    return storage;
  } catch (error) {
    console.error("Failed to initialize GCS client:", error);
    throw new Error("GCS client initialization failed");
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
