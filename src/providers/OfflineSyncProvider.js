// src/providers/OfflineSyncProvider.js
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { get, set, del } from "idb-keyval";
import { postAnalysis } from "../services/api";
import { toast } from "react-hot-toast";

const OfflineSyncContext = createContext();

export const useOfflineSync = () => useContext(OfflineSyncContext);

const QUEUE_KEY = "pending_measurements";

export const OfflineSyncProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Request Persistent Storage
  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persistent) => {
        if (persistent) {
          console.log("Storage will not be cleared except by explicit user action.");
        }
      });
    }
  }, []);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load queue on init
  const loadQueue = useCallback(async () => {
    const stored = (await get(QUEUE_KEY)) || [];
    setQueue(stored);
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Sync logic
  const syncItems = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    const currentQueue = (await get(QUEUE_KEY)) || [];
    if (currentQueue.length === 0) return;

    // Only sync items that are 'pending' or were previously 'failed' but we want to retry
    const itemsToSync = currentQueue.filter((item) => item.status !== "syncing");
    if (itemsToSync.length === 0) return;

    setIsSyncing(true);
    const toastId = toast.loading(`Syncing ${itemsToSync.length} records...`);

    const updatedQueue = [...currentQueue];

    for (const item of itemsToSync) {
      const idx = updatedQueue.findIndex((q) => q.id === item.id);
      if (idx === -1) continue;

      updatedQueue[idx].status = "syncing";
      setQueue([...updatedQueue]);

      try {
        await postAnalysis(item.payload, item.lang);
        // Success: remove from updatedQueue
        updatedQueue.splice(idx, 1);
        await set(QUEUE_KEY, updatedQueue);
        setQueue([...updatedQueue]);
      } catch (err) {
        console.error("Sync failed for item:", item.id, err);
        updatedQueue[idx].status = "failed";
        updatedQueue[idx].lastError = err.message || "Unknown error";
        updatedQueue[idx].attempts = (updatedQueue[idx].attempts || 0) + 1;
        await set(QUEUE_KEY, updatedQueue);
        setQueue([...updatedQueue]);
      }
    }

    setIsSyncing(false);
    const remaining = updatedQueue.length;
    if (remaining === 0) {
      toast.success("All data synced successfully!", { id: toastId });
    } else {
      toast.error(`Sync finished. ${remaining} items failed.`, { id: toastId });
    }
  }, [isSyncing]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      syncItems();
    }
  }, [isOnline, syncItems]);

  const addToQueue = async (payload, lang) => {
    const currentQueue = (await get(QUEUE_KEY)) || [];
    const newItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      payload,
      lang,
      timestamp: new Date().toISOString(),
      status: "pending",
      attempts: 0,
      lastError: null,
    };
    const newQueue = [...currentQueue, newItem];
    await set(QUEUE_KEY, newQueue);
    setQueue(newQueue);
    toast.success("Saved offline. Will sync when online.", { icon: "📥" });

    // Try to register background sync if supported
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register("sync-records");
      } catch (err) {
        console.warn("Background sync registration failed:", err);
      }
    }
  };

  const removeFromQueue = async (id) => {
    const currentQueue = (await get(QUEUE_KEY)) || [];
    const newQueue = currentQueue.filter((item) => item.id !== id);
    await set(QUEUE_KEY, newQueue);
    setQueue(newQueue);
  };

  const updateQueueItem = async (id, updatedPayload) => {
    const currentQueue = (await get(QUEUE_KEY)) || [];
    const idx = currentQueue.findIndex((item) => item.id === id);
    if (idx !== -1) {
      currentQueue[idx].payload = { ...currentQueue[idx].payload, ...updatedPayload };
      currentQueue[idx].status = "pending";
      currentQueue[idx].lastError = null;
      await set(QUEUE_KEY, currentQueue);
      setQueue([...currentQueue]);
    }
  };

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        queue,
        pendingCount: queue.length,
        isSyncing,
        editingItem,
        setEditingItem,
        addToQueue,
        removeFromQueue,

        updateQueueItem,
        syncManual: syncItems,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
};
