// Hook for managing offline status and connectivity
import { useState, useEffect, useCallback } from 'react';

export interface OfflineStatus {
  isOnline: boolean;
  isOffline: boolean;
  lastOnline: Date | null;
  connectionType: string | null;
}

export interface NetworkInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export function useOfflineStatus() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    lastOnline: typeof navigator !== 'undefined' && navigator.onLine ? new Date() : null,
    connectionType: null
  });

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({});

  const updateOnlineStatus = useCallback(() => {
    const isOnline = navigator.onLine;
    setStatus(prev => ({
      ...prev,
      isOnline,
      isOffline: !isOnline,
      lastOnline: isOnline ? new Date() : prev.lastOnline,
      connectionType: getConnectionType()
    }));

    // Update network info if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setNetworkInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      });
    }
  }, []);

  const getConnectionType = useCallback((): string | null => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || connection.type || null;
    }
    return null;
  }, []);

  // Test actual connectivity by making a small request
  const testConnectivity = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }

    try {
      // Try to fetch a small resource with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Connectivity test failed:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    // Initial status update
    updateOnlineStatus();

    // Listen for online/offline events
    const handleOnline = () => {
      updateOnlineStatus();
      // Dispatch custom event for other parts of the app
      window.dispatchEvent(new CustomEvent('app-online'));
    };

    const handleOffline = () => {
      updateOnlineStatus();
      // Dispatch custom event for other parts of the app
      window.dispatchEvent(new CustomEvent('app-offline'));
    };

    // Listen for connection changes
    const handleConnectionChange = () => {
      updateOnlineStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection info changes if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', handleConnectionChange);
    }

    // Periodic connectivity check when online
    const connectivityInterval = setInterval(async () => {
      if (navigator.onLine) {
        const actuallyOnline = await testConnectivity();
        if (!actuallyOnline && status.isOnline) {
          // Browser thinks we're online but we're not
          handleOffline();
        }
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.removeEventListener('change', handleConnectionChange);
      }

      clearInterval(connectivityInterval);
    };
  }, [updateOnlineStatus, testConnectivity, status.isOnline]);

  return {
    ...status,
    networkInfo,
    testConnectivity,
    refresh: updateOnlineStatus
  };
}