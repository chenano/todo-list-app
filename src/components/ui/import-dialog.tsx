'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Label } from './label';
import { Progress } from './progress';
import { Badge } from './badge';
import { Separator } from './separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  FileCode,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
  AlertTriangle,
  X
} from 'lucide-react';
import { ImportService, ImportOptions, ImportFormat, ImportProgress, ImportResult, ImportPreview } from '@/lib/import';
import { cn } from '@/lib/utils';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: (result: ImportResult) => void;
}

const formatIcons: Record<ImportFormat, React.ComponentType<{ className?: string }>> = {
  json: FileCode,
  csv: FileSpreadsheet,
  todoist: FileText,
  'any-do': FileText,
};

const formatDescriptions: Record<ImportFormat, string> = {
  json: 'JSON export from this app or other compatible formats',
  csv: 'Comma-separated values with task data',
  todoist: 'Todoist export file with projects and tasks',
  'any-do': 'Any.do export file with categories and tasks',
};

export function ImportDialog({ open, onOpenChange, onImportComplete }: ImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [detectedFormat, setDetectedFormat] = useState<ImportFormat | null>(null);
  const [options, setOptions] = useState<ImportOptions>({
    createNewLists: false,
    skipDuplicates: true,
  });
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedFile(null);
      setFileContent('');
      setDetectedFormat(null);
      setProgress(null);
      setPreview(null);
      setShowPreview(false);
      setIsImporting(false);
      setError(null);
    }
  }, [open]);

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setPreview(null);
    setShowPreview(false);

    try {
      const content = await file.text();
      setFileContent(content);

      // Try to detect format
      const importService = new ImportService();
      const format = importService.detectFormat(content);
      setDetectedFormat(format);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to read file');
      setDetectedFormat(null);
    }
  }, []);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleOptionChange = (key: keyof ImportOptions, value: boolean) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handlePreview = async () => {
    if (!fileContent || !detectedFormat) return;

    setPreviewLoading(true);
    setError(null);

    try {
      const importService = new ImportService();
      const previewData = await importService.generatePreview(fileContent, {
        ...options,
        format: detectedFormat,
      });

      setPreview(previewData);
      setShowPreview(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleImport = async () => {
    if (!fileContent || !detectedFormat) return;

    setIsImporting(true);
    setProgress(null);
    setError(null);

    try {
      const importService = new ImportService((progressUpdate) => {
        setProgress(progressUpdate);
      });

      const result = await importService.importData(fileContent, {
        ...options,
        format: detectedFormat,
      });

      if (result.success) {
        onImportComplete?.(result);
        
        // Close dialog after successful import
        setTimeout(() => {
          onOpenChange(false);
        }, 1000);
      } else {
        setError(result.error || 'Import failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const canPreview = selectedFile && fileContent && detectedFormat && !error;
  const canImport = canPreview && !isImporting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Todo Lists
          </DialogTitle>
          <DialogDescription>
            Import your todo lists and tasks from various formats and applications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select File to Import</Label>
            
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                selectedFile 
                  ? "border-green-300 bg-green-50 dark:bg-green-950/20" 
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    {detectedFormat && (
                      <Badge variant="secondary" className="mt-2">
                        {detectedFormat.toUpperCase()} format detected
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setFileContent('');
                      setDetectedFormat(null);
                      setError(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium">Drop your file here or click to browse</p>
                    <p className="text-sm text-muted-foreground">
                      Supports JSON, CSV, Todoist, and Any.do formats
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.txt"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="flex items-start gap-3 p-4">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Import Error</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Format Information */}
          {detectedFormat && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium">Detected Format</Label>
                <Card>
                  <CardContent className="flex items-start gap-3 p-4">
                    {React.createElement(formatIcons[detectedFormat], {
                      className: "h-5 w-5 mt-0.5 text-muted-foreground"
                    })}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium uppercase">{detectedFormat}</span>
                        <Badge variant="secondary">Auto-detected</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDescriptions[detectedFormat]}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Import Options */}
          {detectedFormat && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium">Import Options</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createNewLists"
                      checked={options.createNewLists}
                      onCheckedChange={(checked) => 
                        handleOptionChange('createNewLists', checked as boolean)
                      }
                    />
                    <Label htmlFor="createNewLists" className="text-sm">
                      Create new lists even if lists with the same name exist
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skipDuplicates"
                      checked={options.skipDuplicates}
                      onCheckedChange={(checked) => 
                        handleOptionChange('skipDuplicates', checked as boolean)
                      }
                    />
                    <Label htmlFor="skipDuplicates" className="text-sm">
                      Skip tasks that already exist (based on title)
                    </Label>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Preview Section */}
          {showPreview && preview && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Import Preview</Label>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {preview.totalLists} lists
                    </Badge>
                    <Badge variant="secondary">
                      {preview.totalTasks} tasks
                    </Badge>
                  </div>
                </div>
                
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {/* Warnings */}
                    {preview.warnings.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium">Warnings</span>
                        </div>
                        <div className="space-y-1">
                          {preview.warnings.map((warning, index) => (
                            <p key={index} className="text-sm text-yellow-700 dark:text-yellow-400">
                              • {warning}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lists Preview */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Lists to import:</p>
                      <div className="space-y-1">
                        {preview.lists.map((list, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              {list.name}
                              {list.exists && (
                                <Badge variant="outline" className="text-xs">
                                  Exists
                                </Badge>
                              )}
                            </span>
                            <span className="text-muted-foreground">
                              {list.taskCount} tasks
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tasks Preview */}
                    {preview.tasks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Sample tasks:</p>
                        <div className="space-y-1">
                          {preview.tasks.slice(0, 5).map((task, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">{task.title}</span>
                              <span className="text-muted-foreground ml-2">
                                in {task.listName}
                              </span>
                              {task.completed && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Completed
                                </Badge>
                              )}
                            </div>
                          ))}
                          {preview.tasks.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              ...and {preview.tasks.length - 5} more tasks
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Progress Section */}
          {progress && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {progress.stage === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : progress.stage === 'complete' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span className="text-sm font-medium">
                    {progress.message}
                  </span>
                  {progress.processed !== undefined && progress.total !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      ({progress.processed}/{progress.total})
                    </span>
                  )}
                </div>
                
                {progress.stage !== 'error' && progress.stage !== 'complete' && (
                  <Progress value={progress.progress} className="w-full" />
                )}
                
                {progress.error && (
                  <p className="text-sm text-destructive">{progress.error}</p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!canPreview || previewLoading || isImporting}
          >
            {previewLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </>
            )}
          </Button>
          
          <Button
            onClick={handleImport}
            disabled={!canImport}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}