import { NextRequest, NextResponse } from "next/server";
import { analyzePostureVision } from "@/lib/glm";
import {
  uploadImageToGCS,
  deleteImageFromGCS,
  generateImageFilename,
} from "@/lib/gcs";
import { config } from "@/config";

export async function POST(request: NextRequest) {
  let filename: string | null = null;

  try {
    // 1. Get image blob from request
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // 2. Validate file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large (max 5MB)" },
        { status: 400 }
      );
    }

    // 3. Validate file type
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // 4. Generate unique filename
    filename = generateImageFilename();

    // 5. Upload to GCS
    const imageUrl = await uploadImageToGCS(imageFile, filename);

    // 6. Analyze with GLM vision
    const analysis = await analyzePostureVision(imageUrl);

    // 7. Determine severity based on label
    const labelMatch = analysis.match(/LABEL\s*:\s*(GOOD|WARNING|BAD)/i);
    const normalizedLabel = labelMatch?.[1]?.toLowerCase();
    let severity: "good" | "warning" | "bad" = "good";

    if (normalizedLabel === "bad") {
      severity = "bad";
    } else if (normalizedLabel === "warning") {
      severity = "warning";
    }

    const cleanedAnalysis = analysis.replace(/LABEL\s*:\s*(GOOD|WARNING|BAD)\s*/i, "").trim();

    // 8. Return response
    return NextResponse.json({
      success: true,
      analysis: cleanedAnalysis,
      severity,
    });
  } catch (error) {
    console.error("Posture analysis error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 }
    );
  } finally {
    // 9. Delete file from GCS UNLESS debug mode is enabled
    if (filename && !config.app.debugKeepGcsFiles) {
      await deleteImageFromGCS(filename);
    }
  }
}
