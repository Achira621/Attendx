import { NextResponse } from "next/server";
import { pingDatabase } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET() {
  const startTime = performance.now();
  const dbHealth = await pingDatabase();
  const totalDuration = Math.round(performance.now() - startTime);

  const status = dbHealth.ok ? 200 : 503;

  return NextResponse.json(
    {
      status: dbHealth.ok ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || "development",
      neonBranch: process.env.NEON_BRANCH || "production",
      services: {
        database: {
          status: dbHealth.ok ? "up" : "down",
          latencyMs: dbHealth.latencyMs,
          error: dbHealth.error,
        },
        serverlessRuntime: {
          status: "up",
          nodeVersion: process.version,
          memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        },
      },
      durationMs: totalDuration,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Server-Timing": `total;dur=${totalDuration}, db;dur=${dbHealth.latencyMs}`,
      },
    }
  );
}
