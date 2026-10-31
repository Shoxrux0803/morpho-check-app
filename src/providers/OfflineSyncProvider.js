// src/providers/OfflineSyncProvider.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { get, set } from 'idb-keyval';
import { postAnalysis } from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const OfflineSyncContext = createContext();

export const useOfflineSync = () => useContext(OfflineSyncContext);

const QUEUE_KEY_PREFIX = 'pending_measurements';

export const OfflineSyncProvider = ({ children }) => {
  const { user } = useAuth();
  const ownerId = user?.id == null ? null : String(user.id);
  const queueKey = ownerId ? `${QUEUE_KEY_PREFIX}:${ownerId}` : null;
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Request Persistent Storage
  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persistent) => {
        if (persistent) {
          console.info(
            'Storage will not be cleared except by explicit user action.'
          );
        }
      });
    }
  }, []);

  // Load queue on init
  const loadQueue = useCallback(async () => {
    if (!queueKey) {
      setQueue([]);
      return;
    }
    const stored = (await get(queueKey)) || [];
    setQueue(stored);
  }, [queueKey]);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'SYNC_UPDATED') {
        loadQueue();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, [loadQueue]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Sync logic
  const syncItems = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    if (!queueKey) return;
    const currentQueue = (await get(queueKey)) || [];
    if (currentQueue.length === 0) return;

    // Only sync items that are 'pending' or were previously 'failed' but we want to retry
    const itemsToSync = currentQueue.filter(
      (item) => item.status !== 'syncing'
    );
    if (itemsToSync.length === 0) return;

    setIsSyncing(true);
    const toastId = toast.loading(`Syncing ${itemsToSync.length} records...`);

    const updatedQueue = [...currentQueue];

    for (const item of itemsToSync) {
      const idx = updatedQueue.findIndex((q) => q.id === item.id);
      if (idx === -1) continue;

      updatedQueue[idx].status = 'syncing';
      setQueue([...updatedQueue]);

      try {
        await postAnalysis(item.payload, item.lang, item.id);
        // Success: remove from updatedQueue
        updatedQueue.splice(idx, 1);
        await set(queueKey, updatedQueue);
        setQueue([...updatedQueue]);
      } catch (err) {
        console.error('Sync failed for item:', item.id, err);
        updatedQueue[idx].status = 'failed';
        updatedQueue[idx].lastError = err.message || 'Unknown error';
        updatedQueue[idx].attempts = (updatedQueue[idx].attempts || 0) + 1;
        await set(queueKey, updatedQueue);
        setQueue([...updatedQueue]);
      }
    }

    setIsSyncing(false);
    const remaining = updatedQueue.length;
    if (remaining === 0) {
      toast.success('All data synced successfully!', { id: toastId });
    } else {
      toast.error(`Sync finished. ${remaining} items failed.`, { id: toastId });
    }
  }, [isSyncing, queueKey]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      syncItems();
    }
  }, [isOnline, syncItems]);

  const addToQueue = async (payload, lang) => {
    if (!queueKey) {
      throw new Error('Offline navbat uchun foydalanuvchi aniqlanmadi');
    }
    const currentQueue = (await get(queueKey)) || [];
    const newItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      payload,
      lang,
      timestamp: new Date().toISOString(),
      status: 'pending',
      attempts: 0,
      lastError: null,
      ownerId,
    };
    const newQueue = [...currentQueue, newItem];
    await set(queueKey, newQueue);
    await set('active_measurement_queue_key', queueKey);
    setQueue(newQueue);
    toast.success('Saved offline. Will sync when online.', { icon: '📥' });

    // Try to register background sync if supported
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-records');
      } catch (err) {
        console.warn('Background sync registration failed:', err);
      }
    }
  };

  const removeFromQueue = async (id) => {
    if (!queueKey) return;
    const currentQueue = (await get(queueKey)) || [];
    const newQueue = currentQueue.filter((item) => item.id !== id);
    await set(queueKey, newQueue);
    setQueue(newQueue);
  };

  const updateQueueItem = async (id, updatedPayload) => {
    if (!queueKey) return;
    const currentQueue = (await get(queueKey)) || [];
    const idx = currentQueue.findIndex((item) => item.id === id);
    if (idx !== -1) {
      currentQueue[idx].payload = {
        ...currentQueue[idx].payload,
        ...updatedPayload,
      };
      currentQueue[idx].status = 'pending';
      currentQueue[idx].lastError = null;
      await set(queueKey, currentQueue);
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
