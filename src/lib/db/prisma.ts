import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Execute a database operation with bounded retry on transient connection drops
 * Useful for Neon serverless compute auto-resume spikes.
 */
export async function withDbRetry<T>(
  operation: (client: PrismaClient) => Promise<T>,
  maxRetries = 3,
  delayMs = 250
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation(prisma);
    } catch (err: unknown) {
      lastError = err;
      const isConnectionError =
        err instanceof Error &&
        (err.message.includes("Can't reach database server") ||
          err.message.includes("Connection terminated") ||
          err.message.includes("Connection lost") ||
          err.message.includes("Timed out"));

      if (!isConnectionError || attempt === maxRetries) {
        throw err;
      }

      const backoff = delayMs * Math.pow(2, attempt - 1);
      await new Promise((res) => setTimeout(res, backoff));
    }
  }
  throw lastError;
}

/**
 * Health check ping for Neon DB
 */
export async function pingDatabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Math.round(performance.now() - start) };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - start),
      error: errorMsg,
    };
  }
}
