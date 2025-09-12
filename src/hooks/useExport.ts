'use client';

import { useState, useCallback } from 'react';
import { ExportService, ExportOptions, ExportProgress, ExportResult } from '@/lib/export';

export interface UseExportReturn {
  isExporting: boolean;
  progress: ExportProgress | null;
  exportData: (options: ExportOptions) => Promise<ExportResult>;
  getPreview: (options: ExportOptions) => Promise<{
    success: boolean;
    preview?: any;
    error?: string;
  }>;
  downloadFile: (data: string, filename: string, mimeType: string) => void;
  resetProgress: () => void;
}

export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);

  const exportData = useCallback(async (options: ExportOptions): Promise<ExportResult> => {
    setIsExporting(true);
    setProgress(null);

    try {
      const exportService = new ExportService((progressUpdate) => {
        setProgress(progressUpdate);
      });

      const result = await exportService.exportData(options);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setProgress({
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        error: errorMessage,
      });
      
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: errorMessage,
      };
    } finally {
      setIsExporting(false);
    }
  }, []);

  const getPreview = useCallback(async (options: ExportOptions) => {
    try {
      const exportService = new ExportService();
      return await exportService.getExportPreview(options);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Preview failed',
      };
    }
  }, []);

  const downloadFile = useCallback((data: string, filename: string, mimeType: string) => {
    try {
      ExportService.downloadFile(data, filename, mimeType);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(null);
    setIsExporting(false);
  }, []);

  return {
    isExporting,
    progress,
    exportData,
    getPreview,
    downloadFile,
    resetProgress,
  };
}