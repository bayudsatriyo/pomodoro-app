import { NextRequest, NextResponse } from "next/server";

// This is now a client-side only operation
// API routes are kept for consistency but return instructions to use client-side storage

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message:
      "Sessions are stored in localStorage. Use client-side storage utilities.",
    note: "This endpoint is not used in localStorage mode",
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message:
      "Sessions are stored in localStorage. Use client-side storage utilities.",
    note: "This endpoint is not used in localStorage mode",
  });
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({
    message:
      "Sessions are stored in localStorage. Use client-side storage utilities.",
    note: "This endpoint is not used in localStorage mode",
  });
}
