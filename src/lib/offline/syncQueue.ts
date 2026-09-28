import { AttendancePayload, VerificationResult } from "@/types/verification";

const DB_NAME = "attendex_offline_store";
const DB_VERSION = 1;
const STORE_NAME = "pending_attendance_sync";

export interface QueuedAttendanceItem {
  id: string; // attemptId
  payload: AttendancePayload;
  queuedAt: number;
  syncAttempts: number;
  lastError?: string;
}

export class OfflineSyncQueue {
  private static openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        reject(new Error("IndexedDB is not supported in this environment"));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Queue signed attendance payload when device is offline
   */
  public static async enqueue(payload: AttendancePayload): Promise<void> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const item: QueuedAttendanceItem = {
        id: payload.attemptId,
        payload,
        queuedAt: Date.now(),
        syncAttempts: 0,
      };

      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve all pending queued attendance items
   */
  public static async getAllPending(): Promise<QueuedAttendanceItem[]> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove item after successful sync
   */
  public static async dequeue(id: string): Promise<void> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Flush pending items to backend API upon network restoration
   */
  public static async flushQueue(
    onItemSynced?: (item: QueuedAttendanceItem, result: VerificationResult) => void
  ): Promise<{ syncedCount: number; failedCount: number }> {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { syncedCount: 0, failedCount: 0 };
    }

    const items = await this.getAllPending();
    let syncedCount = 0;
    let failedCount = 0;

    for (const item of items) {
      try {
        const response = await fetch("/api/v1/attendance/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });

        const result = (await response.json()) as VerificationResult;

        if (response.ok && result.outcome === "ACCEPTED") {
          await this.dequeue(item.id);
          syncedCount++;
          if (onItemSynced) onItemSynced(item, result);
        } else {
          // If server explicitly rejected (e.g. invalid signature or fraud), remove to prevent endless retry
          if (result.outcome === "REJECTED" || result.outcome === "BLOCKED") {
            await this.dequeue(item.id);
          }
          failedCount++;
        }
      } catch (err: unknown) {
        failedCount++;
        console.error(`[OfflineSyncQueue] Failed to sync attempt ${item.id}:`, err);
      }
    }

    return { syncedCount, failedCount };
  }
}
