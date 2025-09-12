// Service worker registration and management
import { useState, useEffect, useCallback } from 'react';

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  needsUpdate: boolean;
  error: string | null;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private listeners: Set<(status: ServiceWorkerStatus) => void> = new Set();
  private status: ServiceWorkerStatus = {
    isSupported: false,
    isRegistered: false,
    isActive: false,
    needsUpdate: false,
    error: null
  };

  constructor() {
    this.status.isSupported = 'serviceWorker' in navigator;
  }

  // Register service worker
  async register(): Promise<void> {
    if (!this.status.isSupported) {
      throw new Error('Service workers are not supported in this browser');
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.setupEventListeners();
      this.updateStatus();

      console.log('Service worker registered successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.status.error = errorMessage;
      this.notifyListeners();
      throw error;
    }
  }

  // Unregister service worker
  async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister();
      this.registration = null;
      this.updateStatus();
      console.log('Service worker unregistered');
    }
  }

  // Update service worker
  async update(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
      console.log('Service worker update check completed');
    }
  }

  // Skip waiting and activate new service worker
  async skipWaiting(): Promise<void> {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Clear all caches
  async clearCaches(): Promise<void> {
    if (this.registration?.active) {
      this.registration.active.postMessage({ type: 'CLEAR_CACHE' });
    }
  }

  // Send message to service worker
  postMessage(message: any): void {
    if (this.registration?.active) {
      this.registration.active.postMessage(message);
    }
  }

  // Add status listener
  addListener(listener: (status: ServiceWorkerStatus) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current status
    listener(this.status);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Get current status
  getStatus(): ServiceWorkerStatus {
    return { ...this.status };
  }

  // Setup event listeners for service worker
  private setupEventListeners(): void {
    if (!this.registration) return;

    // Listen for service worker state changes
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          this.updateStatus();
        });
      }
    });

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this.updateStatus();
      // Reload page when new service worker takes control
      window.location.reload();
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });
  }

  // Handle messages from service worker
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data);
        break;
      case 'OFFLINE_OPERATION_QUEUED':
        console.log('Operation queued for offline sync:', data);
        break;
      default:
        console.log('Unknown service worker message:', type, data);
    }
  }

  // Update status and notify listeners
  private updateStatus(): void {
    if (!this.registration) {
      this.status = {
        isSupported: this.status.isSupported,
        isRegistered: false,
        isActive: false,
        needsUpdate: false,
        error: null
      };
    } else {
      this.status = {
        isSupported: true,
        isRegistered: true,
        isActive: !!this.registration.active,
        needsUpdate: !!this.registration.waiting,
        error: null
      };
    }

    this.notifyListeners();
  }

  // Notify all listeners of status change
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('Error in service worker status listener:', error);
      }
    });
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Hook for using service worker status
export function useServiceWorker() {
  const [status, setStatus] = useState<ServiceWorkerStatus>(
    serviceWorkerManager.getStatus()
  );

  useEffect(() => {
    const unsubscribe = serviceWorkerManager.addListener(setStatus);
    return unsubscribe;
  }, []);

  const register = useCallback(async () => {
    try {
      await serviceWorkerManager.register();
    } catch (error) {
      console.error('Failed to register service worker:', error);
    }
  }, []);

  const unregister = useCallback(async () => {
    try {
      await serviceWorkerManager.unregister();
    } catch (error) {
      console.error('Failed to unregister service worker:', error);
    }
  }, []);

  const update = useCallback(async () => {
    try {
      await serviceWorkerManager.update();
    } catch (error) {
      console.error('Failed to update service worker:', error);
    }
  }, []);

  const skipWaiting = useCallback(async () => {
    try {
      await serviceWorkerManager.skipWaiting();
    } catch (error) {
      console.error('Failed to skip waiting:', error);
    }
  }, []);

  const clearCaches = useCallback(async () => {
    try {
      await serviceWorkerManager.clearCaches();
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }, []);

  return {
    status,
    register,
    unregister,
    update,
    skipWaiting,
    clearCaches,
    postMessage: serviceWorkerManager.postMessage.bind(serviceWorkerManager)
  };
}

// Auto-register service worker in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  serviceWorkerManager.register().catch(error => {
    console.error('Failed to register service worker:', error);
  });
}