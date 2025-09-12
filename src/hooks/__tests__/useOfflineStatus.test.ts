// Tests for useOfflineStatus hook
import { renderHook, act } from '@testing-library/react';
import { useOfflineStatus } from '../useOfflineStatus';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
});

// Mock fetch
global.fetch = jest.fn();

describe('useOfflineStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (navigator as any).onLine = true;
    (fetch as jest.Mock).mockResolvedValue({
      ok: true
    });
  });

  afterEach(() => {
    // Clean up event listeners
    window.removeEventListener('online', jest.fn());
    window.removeEventListener('offline', jest.fn());
  });

  it('should return initial online status', () => {
    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
    expect(result.current.lastOnline).toBeInstanceOf(Date);
  });

  it('should detect offline status', () => {
    const { result } = renderHook(() => useOfflineStatus());

    act(() => {
      (navigator as any).onLine = false;
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it('should detect online status change', () => {
    // Start offline
    (navigator as any).onLine = false;
    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.isOffline).toBe(true);

    act(() => {
      (navigator as any).onLine = true;
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
    expect(result.current.lastOnline).toBeInstanceOf(Date);
  });

  it('should include network information when available', () => {
    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.networkInfo).toEqual({
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false
    });
  });

  it('should test connectivity', async () => {
    const { result } = renderHook(() => useOfflineStatus());

    const isConnected = await result.current.testConnectivity();

    expect(isConnected).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: expect.any(AbortSignal)
    });
  });

  it('should handle connectivity test failure', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useOfflineStatus());

    const isConnected = await result.current.testConnectivity();

    expect(isConnected).toBe(false);
  });

  it('should return false for connectivity test when offline', async () => {
    (navigator as any).onLine = false;
    const { result } = renderHook(() => useOfflineStatus());

    const isConnected = await result.current.testConnectivity();

    expect(isConnected).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should refresh status', () => {
    const { result } = renderHook(() => useOfflineStatus());

    act(() => {
      result.current.refresh();
    });

    // Should trigger status update
    expect(result.current.isOnline).toBe(true);
  });

  it('should handle connection change events', () => {
    const { result } = renderHook(() => useOfflineStatus());
    const connection = (navigator as any).connection;

    act(() => {
      connection.effectiveType = '3g';
      connection.downlink = 5;
      // Simulate connection change event
      const changeHandler = connection.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'change'
      )?.[1];
      if (changeHandler) {
        changeHandler();
      }
    });

    expect(result.current.networkInfo.effectiveType).toBe('3g');
    expect(result.current.networkInfo.downlink).toBe(5);
  });

  it('should dispatch custom events on status change', () => {
    const onlineHandler = jest.fn();
    const offlineHandler = jest.fn();

    window.addEventListener('app-online', onlineHandler);
    window.addEventListener('app-offline', offlineHandler);

    renderHook(() => useOfflineStatus());

    act(() => {
      (navigator as any).onLine = false;
      window.dispatchEvent(new Event('offline'));
    });

    expect(offlineHandler).toHaveBeenCalled();

    act(() => {
      (navigator as any).onLine = true;
      window.dispatchEvent(new Event('online'));
    });

    expect(onlineHandler).toHaveBeenCalled();

    window.removeEventListener('app-online', onlineHandler);
    window.removeEventListener('app-offline', offlineHandler);
  });
});