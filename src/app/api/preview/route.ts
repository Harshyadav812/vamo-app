import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ canEmbed: false, error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout

    const response = await fetch(targetUrl, {
      method: "HEAD", // Just get headers
      signal: controller.signal,
      headers: {
        "User-Agent": "Vamo-Preview-Bot/1.0",
      },
    });

    clearTimeout(timeoutId);

    const xFrameOptions = response.headers.get("x-frame-options")?.toLowerCase();
    const csp = response.headers.get("content-security-policy")?.toLowerCase();

    let canEmbed = true;

    if (xFrameOptions === "deny" || xFrameOptions === "sameorigin") {
      canEmbed = false;
    }

    if (csp && (csp.includes("frame-ancestors 'none'") || csp.includes("frame-ancestors 'self'"))) {
      canEmbed = false;
    }

    return NextResponse.json({ canEmbed });
  } catch (error) {
    // If there's an error (e.g., timeout, network issue, CORS preflight blocking HEAD),
    // it's safer to assume it might not be easily embeddable or we just fallback to screenshot
    return NextResponse.json({ canEmbed: false, error: "Failed to verify embeddability" });
  }
}
