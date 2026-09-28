import { NextRequest, NextResponse } from "next/server";
import { OutboxProcessor } from "@/lib/outbox/outboxProcessor";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  return handleOutbox(req);
}

export async function POST(req: NextRequest) {
  return handleOutbox(req);
}

async function handleOutbox(req: NextRequest) {
  try {
    // Optional: Validate CRON_SECRET if configured on Vercel
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized worker invocation" }, { status: 401 });
    }

    const result = await OutboxProcessor.processPendingEvents();

    return NextResponse.json(
      {
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    console.error("[Worker /api/v1/workers/outbox] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during outbox processing.",
      },
      { status: 500 }
    );
  }
}
