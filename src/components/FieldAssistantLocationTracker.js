import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminApi } from '../services/api';

const MIN_SEND_INTERVAL_MS = 30000;
const MIN_MOVE_METERS = 25;

const distanceMeters = (a, b) => {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const toRad = (value) => (value * Math.PI) / 180;
  const radius = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
};

export default function FieldAssistantLocationTracker() {
  const { user } = useAuth();
  const lastSentRef = useRef(null);
  const lastSentAtRef = useRef(0);

  useEffect(() => {
    if (user?.role !== 'field_assistant') return undefined;
    if (!navigator.geolocation) return undefined;

    let cancelled = false;
    let watchId = null;

    const sendPosition = async (position) => {
      if (cancelled) return;
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
      const now = Date.now();
      const moved = distanceMeters(lastSentRef.current, coords);

      if (
        lastSentRef.current &&
        now - lastSentAtRef.current < MIN_SEND_INTERVAL_MS &&
        moved < MIN_MOVE_METERS
      ) {
        return;
      }

      try {
        await AdminApi.activity.updateLocation(coords);
        lastSentRef.current = coords;
        lastSentAtRef.current = now;
      } catch {
        // Location tracking is best-effort; the app should continue silently.
      }
    };

    watchId = navigator.geolocation.watchPosition(
      sendPosition,
      () => {},
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 20000,
      }
    );

    return () => {
      cancelled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [user?.role]);

  return null;
}