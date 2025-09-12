'use client';

import { useState, useCallback } from 'react';
import { ImportService, ImportOptions, ImportProgress, ImportResult, ImportPreview } from '@/lib/import';

export interface UseImportReturn {
  isImporting: boolean;
  progress: ImportProgress | null;
  importData: (data: string, options?: ImportOptions) => Promise<ImportResult>;
  generatePreview: (data: string, options?: ImportOptions) => Promise<ImportPreview>;
  detectFormat: (data: string) => string;
  resetProgress: () => void;
}

export function useImport(): UseImportReturn {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  const importData = useCallback(async (data: string, options: ImportOptions = {}): Promise<ImportResult> => {
    setIsImporting(true);
    setProgress(null);

    try {
      const importService = new ImportService((progressUpdate) => {
        setProgress(progressUpdate);
      });

      const result = await importService.importData(data, options);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      setProgress({
        stage: 'error',
        progress: 0,
        message: 'Import failed',
        error: errorMessage,
      });
      
      return {
        success: false,
        importedLists: 0,
        importedTasks: 0,
        skippedTasks: 0,
        errors: [errorMessage],
      };
    } finally {
      setIsImporting(false);
    }
  }, []);

  const generatePreview = useCallback(async (data: string, options: ImportOptions = {}): Promise<ImportPreview> => {
    const importService = new ImportService();
    return await importService.generatePreview(data, options);
  }, []);

  const detectFormat = useCallback((data: string): string => {
    const importService = new ImportService();
    return importService.detectFormat(data);
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(null);
    setIsImporting(false);
  }, []);

  return {
    isImporting,
    progress,
    importData,
    generatePreview,
    detectFormat,
    resetProgress,
  };
}