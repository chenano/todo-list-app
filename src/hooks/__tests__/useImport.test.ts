import { renderHook, act } from '@testing-library/react';
import { useImport } from '../useImport';
import { ImportService, ImportOptions } from '@/lib/import';

// Mock the import service
jest.mock('@/lib/import');

const mockImportService = ImportService as jest.MockedClass<typeof ImportService>;

describe('useImport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useImport());

    expect(result.current.isImporting).toBe(false);
    expect(result.current.progress).toBe(null);
    expect(typeof result.current.importData).toBe('function');
    expect(typeof result.current.generatePreview).toBe('function');
    expect(typeof result.current.detectFormat).toBe('function');
    expect(typeof result.current.resetProgress).toBe('function');
  });

  describe('importData', () => {
    it('should handle successful import', async () => {
      const mockImportData = jest.fn().mockResolvedValue({
        success: true,
        importedLists: 2,
        importedTasks: 5,
        skippedTasks: 1,
        errors: [],
      });

      mockImportService.mockImplementation(() => ({
        importData: mockImportData,
      }) as any);

      const { result } = renderHook(() => useImport());

      const data = '{"test": "data"}';
      const options: ImportOptions = {
        createNewLists: true,
        skipDuplicates: false,
      };

      let importResult;
      await act(async () => {
        importResult = await result.current.importData(data, options);
      });

      expect(result.current.isImporting).toBe(false);
      expect(mockImportData).toHaveBeenCalledWith(data, options);
      expect(importResult).toEqual({
        success: true,
        importedLists: 2,
        importedTasks: 5,
        skippedTasks: 1,
        errors: [],
      });
    });

    it('should handle import failure', async () => {
      const mockImportData = jest.fn().mockResolvedValue({
        success: false,
        importedLists: 0,
        importedTasks: 0,
        skippedTasks: 0,
        errors: ['Import failed'],
        error: 'Database error',
      });

      mockImportService.mockImplementation(() => ({
        importData: mockImportData,
      }) as any);

      const { result } = renderHook(() => useImport());

      const data = '{"test": "data"}';

      let importResult;
      await act(async () => {
        importResult = await result.current.importData(data);
      });

      expect(result.current.isImporting).toBe(false);
      expect(importResult).toEqual({
        success: false,
        importedLists: 0,
        importedTasks: 0,
        skippedTasks: 0,
        errors: ['Import failed'],
        error: 'Database error',
      });
    });

    it('should handle import exception', async () => {
      const mockImportData = jest.fn().mockRejectedValue(new Error('Network error'));

      mockImportService.mockImplementation(() => ({
        importData: mockImportData,
      }) as any);

      const { result } = renderHook(() => useImport());

      const data = '{"test": "data"}';

      let importResult;
      await act(async () => {
        importResult = await result.current.importData(data);
      });

      expect(result.current.isImporting).toBe(false);
      expect(result.current.progress).toEqual({
        stage: 'error',
        progress: 0,
        message: 'Import failed',
        error: 'Network error',
      });
      expect(importResult).toEqual({
        success: false,
        importedLists: 0,
        importedTasks: 0,
        skippedTasks: 0,
        errors: ['Network error'],
      });
    });

    it('should update progress during import', async () => {
      let progressCallback: ((progress: any) => void) | undefined;

      const mockImportData = jest.fn().mockImplementation(() => {
        if (progressCallback) {
          progressCallback({
            stage: 'importing',
            progress: 50,
            message: 'Importing tasks...',
            processed: 2,
            total: 4,
          });
        }
        
        return Promise.resolve({
          success: true,
          importedLists: 1,
          importedTasks: 4,
          skippedTasks: 0,
          errors: [],
        });
      });

      mockImportService.mockImplementation((callback) => {
        progressCallback = callback;
        return {
          importData: mockImportData,
        } as any;
      });

      const { result } = renderHook(() => useImport());

      const data = '{"test": "data"}';

      await act(async () => {
        await result.current.importData(data);
      });

      expect(result.current.progress).toEqual({
        stage: 'importing',
        progress: 50,
        message: 'Importing tasks...',
        processed: 2,
        total: 4,
      });
    });

    it('should set isImporting during import', async () => {
      const mockImportData = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              importedLists: 1,
              importedTasks: 2,
              skippedTasks: 0,
              errors: [],
            });
          }, 100);
        });
      });

      mockImportService.mockImplementation(() => ({
        importData: mockImportData,
      }) as any);

      const { result } = renderHook(() => useImport());

      const data = '{"test": "data"}';

      // Start import
      act(() => {
        result.current.importData(data);
      });

      // Should be importing
      expect(result.current.isImporting).toBe(true);

      // Wait for completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Should no longer be importing
      expect(result.current.isImporting).toBe(false);
    });
  });

  describe('generatePreview', () => {
    it('should handle successful preview generation', async () => {
      const mockGeneratePreview = jest.fn().mockResolvedValue({
        format: 'json',
        lists: [{ name: 'Work', taskCount: 3, exists: false }],
        tasks: [
          { title: 'Task 1', listName: 'Work', completed: false },
          { title: 'Task 2', listName: 'Work', completed: true },
        ],
        totalLists: 1,
        totalTasks: 3,
        warnings: [],
      });

      mockImportService.mockImplementation(() => ({
        generatePreview: mockGeneratePreview,
      }) as any);

      const { result } = renderHook(() => useImport());

      const data = '{"test": "data"}';
      const options: ImportOptions = {
        createNewLists: false,
      };

      let previewResult;
      await act(async () => {
        previewResult = await result.current.generatePreview(data, options);
      });

      expect(mockGeneratePreview).toHaveBeenCalledWith(data, options);
      expect(previewResult).toEqual({
        format: 'json',
        lists: [{ name: 'Work', taskCount: 3, exists: false }],
        tasks: [
          { title: 'Task 1', listName: 'Work', completed: false },
          { title: 'Task 2', listName: 'Work', completed: true },
        ],
        totalLists: 1,
        totalTasks: 3,
        warnings: [],
      });
    });

    it('should handle preview generation failure', async () => {
      const mockGeneratePreview = jest.fn().mockRejectedValue(new Error('Invalid format'));

      mockImportService.mockImplementation(() => ({
        generatePreview: mockGeneratePreview,
      }) as any);

      const { result } = renderHook(() => useImport());

      const data = 'invalid data';

      await expect(
        act(async () => {
          await result.current.generatePreview(data);
        })
      ).rejects.toThrow('Invalid format');
    });
  });

  describe('detectFormat', () => {
    it('should detect format correctly', () => {
      const mockDetectFormat = jest.fn().mockReturnValue('csv');

      mockImportService.mockImplementation(() => ({
        detectFormat: mockDetectFormat,
      }) as any);

      const { result } = renderHook(() => useImport());

      const data = 'List,Task\nWork,Task 1';
      const format = result.current.detectFormat(data);

      expect(mockDetectFormat).toHaveBeenCalledWith(data);
      expect(format).toBe('csv');
    });

    it('should handle format detection errors', () => {
      const mockDetectFormat = jest.fn().mockImplementation(() => {
        throw new Error('Unable to detect format');
      });

      mockImportService.mockImplementation(() => ({
        detectFormat: mockDetectFormat,
      }) as any);

      const { result } = renderHook(() => useImport());

      const data = 'invalid data';

      expect(() => {
        result.current.detectFormat(data);
      }).toThrow('Unable to detect format');
    });
  });

  describe('resetProgress', () => {
    it('should reset progress and isImporting state', async () => {
      const mockImportData = jest.fn().mockResolvedValue({
        success: false,
        importedLists: 0,
        importedTasks: 0,
        skippedTasks: 0,
        errors: ['Import failed'],
      });

      mockImportService.mockImplementation(() => ({
        importData: mockImportData,
      }) as any);

      const { result } = renderHook(() => useImport());

      // First, set some state
      await act(async () => {
        await result.current.importData('{"test": "data"}');
      });

      // Reset progress
      act(() => {
        result.current.resetProgress();
      });

      expect(result.current.progress).toBe(null);
      expect(result.current.isImporting).toBe(false);
    });
  });

  describe('default options handling', () => {
    it('should use default options when none provided', async () => {
      const mockImportData = jest.fn().mockResolvedValue({
        success: true,
        importedLists: 1,
        importedTasks: 2,
        skippedTasks: 0,
        errors: [],
      });

      mockImportService.mockImplementation(() => ({
        importData: mockImportData,
      }) as any);

      const { result } = renderHook(() => useImport());

      const data = '{"test": "data"}';

      await act(async () => {
        await result.current.importData(data);
      });

      expect(mockImportData).toHaveBeenCalledWith(data, {});
    });

    it('should use default options for preview when none provided', async () => {
      const mockGeneratePreview = jest.fn().mockResolvedValue({
        format: 'json',
        lists: [],
        tasks: [],
        totalLists: 0,
        totalTasks: 0,
        warnings: [],
      });

      mockImportService.mockImplementation(() => ({
        generatePreview: mockGeneratePreview,
      }) as any);

      const { result } = renderHook(() => useImport());

      const data = '{"test": "data"}';

      await act(async () => {
        await result.current.generatePreview(data);
      });

      expect(mockGeneratePreview).toHaveBeenCalledWith(data, {});
    });
  });
});