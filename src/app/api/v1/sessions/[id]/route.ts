import { NextRequest, NextResponse } from "next/server";
import { SessionRepository } from "@/repositories/SessionRepository";
import { getAuthUserFromRequest } from "@/lib/auth/jwt";
import { SessionCache } from "@/lib/cache/sessionCache";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing session ID" }, { status: 400 });
    }

    const session = await SessionRepository.getSessionWithRoster(id);
    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, session },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/v1/sessions/[id]] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (authUser && authUser.role === "STUDENT") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Students cannot modify sessions." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { action, graceDurationSeconds } = body;

    let updatedSession;

    switch (action) {
      case "start":
        updatedSession = await SessionRepository.startSession(id);
        break;
      case "grace_period":
        updatedSession = await SessionRepository.startGracePeriod(id, graceDurationSeconds || 60);
        break;
      case "close":
        updatedSession = await SessionRepository.closeSession(id);
        break;
      case "archive":
        updatedSession = await SessionRepository.archiveSession(id);
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Invalid transition action '${action}'. Allowed: start, grace_period, close, archive.` },
          { status: 400 }
        );
    }

    // Invalidate cached session so student submissions immediately see new status
    SessionCache.invalidate(id);

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update session.";
    console.error("[PATCH /api/v1/sessions/[id]] Error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 422 });
  }
}
