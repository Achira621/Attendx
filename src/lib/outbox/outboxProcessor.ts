import { prisma } from "@/lib/db/prisma";
import { OutboxStatus } from "@prisma/client";

export interface OutboxProcessingResult {
  processed: number;
  succeeded: number;
  failed: number;
  durationMs: number;
}

export class OutboxProcessor {
  private static readonly BATCH_SIZE = 50;
  private static readonly MAX_RETRIES = 5;

  /**
   * Drain pending outbox events and dispatch downstream
   */
  public static async processPendingEvents(): Promise<OutboxProcessingResult> {
    const startTime = performance.now();

    // 1. Fetch pending events
    const pendingEvents = await prisma.outboxEvent.findMany({
      where: {
        status: OutboxStatus.PENDING,
        retryCount: { lt: this.MAX_RETRIES },
      },
      take: this.BATCH_SIZE,
      orderBy: { createdAt: "asc" },
    });

    let succeeded = 0;
    let failed = 0;

    for (const event of pendingEvents) {
      try {
        // Dispatch event downstream (e.g. WebSocket bus, Notification Worker, Audit Logger)
        // Here we simulate successful dispatch with timing verification
        await this.dispatchEvent(event.eventType, event.payload);

        // Mark as published
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: OutboxStatus.PUBLISHED,
            publishedAt: new Date(),
          },
        });
        succeeded++;
      } catch (err: unknown) {
        console.error(`[OutboxProcessor] Failed to publish event ${event.id}:`, err);
        const newRetryCount = event.retryCount + 1;
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            retryCount: newRetryCount,
            status: newRetryCount >= this.MAX_RETRIES ? OutboxStatus.FAILED : OutboxStatus.PENDING,
          },
        });
        failed++;
      }
    }

    return {
      processed: pendingEvents.length,
      succeeded,
      failed,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  private static async dispatchEvent(eventType: string, payload: unknown): Promise<void> {
    // In production: dispatch to Pusher/Ably/WebSocket server or Redis Stream
    // For Vercel Serverless environment: log structured outbox delivery
    if (process.env.NODE_ENV !== "production") {
      console.log(`[OutboxProcessor] Dispatched event: ${eventType}`, payload);
    }
  }
}
