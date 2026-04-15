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
  const [pendingCount, setPendingCount] = useState(0);

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

  // Sync logic
  const syncItems = useCallback(async () => {
    if (!navigator.onLine) return;

    const queue = (await get(QUEUE_KEY)) || [];
    if (queue.length === 0) {
      setPendingCount(0);
      return;
    }

    toast.loading(`Syncing ${queue.length} pending records...`, { id: "sync-toast" });

    const failed = [];
    for (const item of queue) {
      try {
        await postAnalysis(item.payload, item.lang);
      } catch (err) {
        console.error("Sync failed for item:", item, err);
        failed.push(item);
      }
    }

    if (failed.length === 0) {
      await del(QUEUE_KEY);
      setPendingCount(0);
      toast.success("All offline data synced successfully!", { id: "sync-toast" });
    } else {
      await set(QUEUE_KEY, failed);
      setPendingCount(failed.length);
      toast.error(`Sync completed with ${failed.length} fails.`, { id: "sync-toast" });
    }
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      syncItems();
    }
  }, [isOnline, syncItems]);

  // Initial count check
  useEffect(() => {
    const checkQueue = async () => {
      const queue = (await get(QUEUE_KEY)) || [];
      setPendingCount(queue.length);
    };
    checkQueue();
  }, []);

  const addToQueue = async (payload, lang) => {
    const queue = (await get(QUEUE_KEY)) || [];
    const newItem = {
      id: Date.now(),
      payload,
      lang,
      timestamp: new Date().toISOString(),
    };
    const newQueue = [...queue, newItem];
    await set(QUEUE_KEY, newQueue);
    setPendingCount(newQueue.length);
    toast.success("Saved offline. Will sync when online.", { icon: "📥" });
  };

  return (
    <OfflineSyncContext.Provider value={{ isOnline, pendingCount, addToQueue, syncManual: syncItems }}>
      {children}
    </OfflineSyncContext.Provider>
  );
};
