import { useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { OfflineQueueItem } from "../types";

const QUEUE_KEY = "ave-ai-offline-queue";

function loadQueue(): OfflineQueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as OfflineQueueItem[];
  } catch {
    return [];
  }
}

function saveQueue(items: OfflineQueueItem[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

interface UseOfflineQueueReturn {
  isOnline: boolean;
  queueSize: number;
  enqueue: (userContent: string, sessionId: string) => void;
}

/**
 * Offline Detection & Queue (Diagram 29)
 * - Detects navigator.onLine
 * - Queues messages in localStorage when offline
 * - Flushes queue when 'online' event fires
 * - onFlush is called for each queued item when back online
 */
export function useOfflineQueue(
  onFlush: (item: OfflineQueueItem) => Promise<void>
): UseOfflineQueueReturn {
  const isOnlineRef = useRef(navigator.onLine);
  const queueRef = useRef<OfflineQueueItem[]>(loadQueue());
  const flushingRef = useRef(false);

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    const items = loadQueue();
    if (items.length === 0) return;

    flushingRef.current = true;
    clearQueue();
    queueRef.current = [];

    for (const item of items) {
      try {
        await onFlush(item);
      } catch {
        queueRef.current.push(item);
        saveQueue(queueRef.current);
      }
    }
    flushingRef.current = false;
  }, [onFlush]);

  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      flush();
    };
    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) {
      flush();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flush]);

  const enqueue = useCallback((userContent: string, sessionId: string) => {
    const item: OfflineQueueItem = {
      id: uuidv4(),
      userContent,
      sessionId,
      timestamp: Date.now(),
    };
    queueRef.current.push(item);
    saveQueue(queueRef.current);
  }, []);

  return {
    isOnline: isOnlineRef.current,
    queueSize: queueRef.current.length,
    enqueue,
  };
}
