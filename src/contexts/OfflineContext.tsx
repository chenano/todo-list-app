// Context for managing offline functionality
'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useServiceWorker } from '@/lib/service-worker';
import { offlineStorage } from '@/lib/offline-storage';

interface OfflineContextType {
  // Service worker status and methods are available through useServiceWorker hook
  // This context mainly handles initialization
}

const OfflineContext = createContext<OfflineContextType>({});

export function useOfflineContext() {
  return useContext(OfflineContext);
}

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const { register, status } = useServiceWorker();

  // Initialize offline storage and service worker
  useEffect(() => {
    const initializeOfflineSupport = async () => {
      try {
        // Initialize IndexedDB
        await offlineStorage.init();
        console.log('Offline storage initialized');

        // Register service worker in production
        if (process.env.NODE_ENV === 'production' && status.isSupported) {
          await register();
          console.log('Service worker registered');
        }
      } catch (error) {
        console.error('Failed to initialize offline support:', error);
      }
    };

    initializeOfflineSupport();
  }, [register, status.isSupported]);

  return (
    <OfflineContext.Provider value={{}}>
      {children}
    </OfflineContext.Provider>
  );
}