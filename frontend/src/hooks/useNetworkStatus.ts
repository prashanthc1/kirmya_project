'use client';

import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  offlineSince: Date | null;
}

/**
 * Hook to observe client network connectivity and gracefully handle offline states.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  });

  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setOfflineSince(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setOfflineSince(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    wasOffline,
    offlineSince,
  };
}

export default useNetworkStatus;
