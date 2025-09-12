import { renderHook, act } from '@testing-library/react';
import { useExport } from '../useExport';
import { ExportService, ExportOptions } from '@/lib/export';

// Mock the export service
jest.mock('@/lib/export');

const mockExportService = ExportService as jest.MockedClass<typeof ExportService>;

describe('useExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the static downloadFile method
    mockExportService.downloadFile = jest.fn();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useExport());

    expect(result.current.isExporting).toBe(false);
    expect(result.current.progress).toBe(null);
    expect(typeof result.current.exportData).toBe('function');
    expect(typeof result.current.getPreview).toBe('function');
    expect(typeof result.current.downloadFile).toBe('function');
    expect(typeof result.current.resetProgress).toBe('function');
  });

  describe('exportData', () => {
    it('should handle successful export', async () => {
      const mockExportData = jest.fn().mockResolvedValue({
        success: true,
        data: '{"test": "data"}',
        filename: 'test.json',
        mimeType: 'application/json',
      });

      mockExportService.mockImplementation(() => ({
        exportData: mockExportData,
      }) as any);

      const { result } = renderHook(() => useExport());

      const options: ExportOptions = {
        format: 'json',
        includeCompleted: true,
      };

      let exportResult;
      await act(async () => {
        exportResult = await result.current.exportData(options);
      });

      expect(result.current.isExporting).toBe(false);
      expect(mockExportData).toHaveBeenCalledWith(options);
      expect(exportResult).toEqual({
        success: true,
        data: '{"test": "data"}',
        filename: 'test.json',
        mimeType: 'application/json',
      });
    });

    it('should handle export failure', async () => {
      const mockExportData = jest.fn().mockResolvedValue({
        success: false,
        filename: '',
        mimeType: '',
        error: 'Export failed',
      });

      mockExportService.mockImplementation(() => ({
        exportData: mockExportData,
      }) as any);

      const { result } = renderHook(() => useExport());

      const options: ExportOptions = {
        format: 'json',
        includeCompleted: true,
      };

      let exportResult;
      await act(async () => {
        exportResult = await result.current.exportData(options);
      });

      expect(result.current.isExporting).toBe(false);
      expect(exportResult).toEqual({
        success: false,
        filename: '',
        mimeType: '',
        error: 'Export failed',
      });
    });

    it('should handle export exception', async () => {
      const mockExportData = jest.fn().mockRejectedValue(new Error('Network error'));

      mockExportService.mockImplementation(() => ({
        exportData: mockExportData,
      }) as any);

      const { result } = renderHook(() => useExport());

      const options: ExportOptions = {
        format: 'json',
        includeCompleted: true,
      };

      let exportResult;
      await act(async () => {
        exportResult = await result.current.exportData(options);
      });

      expect(result.current.isExporting).toBe(false);
      expect(result.current.progress).toEqual({
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        error: 'Network error',
      });
      expect(exportResult).toEqual({
        success: false,
        filename: '',
        mimeType: '',
        error: 'Network error',
      });
    });

    it('should update progress during export', async () => {
      let progressCallback: ((progress: any) => void) | undefined;

      const mockExportData = jest.fn().mockImplementation(() => {
        if (progressCallback) {
          progressCallback({
            stage: 'fetching',
            progress: 50,
            message: 'Fetching data...',
          });
        }
        
        return Promise.resolve({
          success: true,
          data: '{"test": "data"}',
          filename: 'test.json',
          mimeType: 'application/json',
        });
      });

      mockExportService.mockImplementation((callback) => {
        progressCallback = callback;
        return {
          exportData: mockExportData,
        } as any;
      });

      const { result } = renderHook(() => useExport());

      const options: ExportOptions = {
        format: 'json',
        includeCompleted: true,
      };

      await act(async () => {
        await result.current.exportData(options);
      });

      expect(result.current.progress).toEqual({
        stage: 'fetching',
        progress: 50,
        message: 'Fetching data...',
      });
    });

    it('should set isExporting during export', async () => {
      const mockExportData = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              data: '{"test": "data"}',
              filename: 'test.json',
              mimeType: 'application/json',
            });
          }, 100);
        });
      });

      mockExportService.mockImplementation(() => ({
        exportData: mockExportData,
      }) as any);

      const { result } = renderHook(() => useExport());

      const options: ExportOptions = {
        format: 'json',
        includeCompleted: true,
      };

      // Start export
      act(() => {
        result.current.exportData(options);
      });

      // Should be exporting
      expect(result.current.isExporting).toBe(true);

      // Wait for completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Should no longer be exporting
      expect(result.current.isExporting).toBe(false);
    });
  });

  describe('getPreview', () => {
    it('should handle successful preview', async () => {
      const mockGetPreview = jest.fn().mockResolvedValue({
        success: true,
        preview: {
          lists: [],
          tasks: [],
          totalLists: 0,
          totalTasks: 0,
        },
      });

      mockExportService.mockImplementation(() => ({
        getExportPreview: mockGetPreview,
      }) as any);

      const { result } = renderHook(() => useExport());

      const options: ExportOptions = {
        format: 'json',
        includeCompleted: true,
      };

      let previewResult;
      await act(async () => {
        previewResult = await result.current.getPreview(options);
      });

      expect(mockGetPreview).toHaveBeenCalledWith(options);
      expect(previewResult).toEqual({
        success: true,
        preview: {
          lists: [],
          tasks: [],
          totalLists: 0,
          totalTasks: 0,
        },
      });
    });

    it('should handle preview failure', async () => {
      const mockGetPreview = jest.fn().mockRejectedValue(new Error('Preview failed'));

      mockExportService.mockImplementation(() => ({
        getExportPreview: mockGetPreview,
      }) as any);

      const { result } = renderHook(() => useExport());

      const options: ExportOptions = {
        format: 'json',
        includeCompleted: true,
      };

      let previewResult;
      await act(async () => {
        previewResult = await result.current.getPreview(options);
      });

      expect(previewResult).toEqual({
        success: false,
        error: 'Preview failed',
      });
    });
  });

  describe('downloadFile', () => {
    it('should call ExportService.downloadFile', () => {
      const { result } = renderHook(() => useExport());

      act(() => {
        result.current.downloadFile('test data', 'test.txt', 'text/plain');
      });

      expect(mockExportService.downloadFile).toHaveBeenCalledWith(
        'test data',
        'test.txt',
        'text/plain'
      );
    });

    it('should handle download errors', () => {
      mockExportService.downloadFile.mockImplementation(() => {
        throw new Error('Download failed');
      });

      const { result } = renderHook(() => useExport());

      expect(() => {
        result.current.downloadFile('test data', 'test.txt', 'text/plain');
      }).toThrow('Download failed');
    });
  });

  describe('resetProgress', () => {
    it('should reset progress and isExporting state', async () => {
      const mockExportData = jest.fn().mockResolvedValue({
        success: false,
        filename: '',
        mimeType: '',
        error: 'Export failed',
      });

      mockExportService.mockImplementation(() => ({
        exportData: mockExportData,
      }) as any);

      const { result } = renderHook(() => useExport());

      // First, set some state
      await act(async () => {
        await result.current.exportData({
          format: 'json',
          includeCompleted: true,
        });
      });

      // Reset progress
      act(() => {
        result.current.resetProgress();
      });

      expect(result.current.progress).toBe(null);
      expect(result.current.isExporting).toBe(false);
    });
  });
});