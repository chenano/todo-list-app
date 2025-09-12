'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileCode,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { ExportService, ExportOptions, ExportFormat, ExportProgress, ExportResult } from '@/lib/export';
import { List, Task } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lists: List[];
}

const formatIcons: Record<ExportFormat, React.ComponentType<{ className?: string }>> = {
  json: FileCode,
  csv: FileSpreadsheet,
  markdown: FileText,
};

const formatDescriptions: Record<ExportFormat, string> = {
  json: 'Complete data structure with all metadata, perfect for backup and migration',
  csv: 'Spreadsheet format for analysis in Excel, Google Sheets, or other tools',
  markdown: 'Human-readable format with formatted task lists and checkboxes',
};

export function ExportDialog({ open, onOpenChange, lists }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [options, setOptions] = useState<Omit<ExportOptions, 'format' | 'selectedLists'>>({
    includeCompleted: true,
    includeDescription: true,
    includeDueDate: true,
    includePriority: true,
    includeCreatedAt: false,
    includeUpdatedAt: false,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [preview, setPreview] = useState<{
    lists: List[];
    tasks: Task[];
    totalLists: number;
    totalTasks: number;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedLists([]);
      setProgress(null);
      setPreview(null);
      setShowPreview(false);
      setIsExporting(false);
    }
  }, [open]);

  const handleListSelection = (listId: string, checked: boolean) => {
    if (checked) {
      setSelectedLists(prev => [...prev, listId]);
    } else {
      setSelectedLists(prev => prev.filter(id => id !== listId));
    }
  };

  const handleSelectAllLists = (checked: boolean) => {
    if (checked) {
      setSelectedLists(lists.map(list => list.id));
    } else {
      setSelectedLists([]);
    }
  };

  const handleOptionChange = (key: keyof typeof options, value: boolean) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const exportService = new ExportService();
      const result = await exportService.getExportPreview({
        format: selectedFormat,
        selectedLists: selectedLists.length > 0 ? selectedLists : undefined,
        ...options,
      });

      if (result.success && result.preview) {
        setPreview(result.preview);
        setShowPreview(true);
      } else {
        console.error('Preview failed:', result.error);
      }
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(null);

    try {
      const exportService = new ExportService((progress) => {
        setProgress(progress);
      });

      const result = await exportService.exportData({
        format: selectedFormat,
        selectedLists: selectedLists.length > 0 ? selectedLists : undefined,
        ...options,
      });

      if (result.success && result.data) {
        ExportService.downloadFile(result.data, result.filename, result.mimeType);
        
        // Close dialog after successful export
        setTimeout(() => {
          onOpenChange(false);
        }, 1000);
      } else {
        console.error('Export failed:', result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedListsCount = selectedLists.length;
  const allListsSelected = selectedListsCount === lists.length;
  const someListsSelected = selectedListsCount > 0 && selectedListsCount < lists.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Todo Lists
          </DialogTitle>
          <DialogDescription>
            Export your todo lists and tasks in various formats for backup or migration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(formatIcons) as ExportFormat[]).map((format) => {
                const Icon = formatIcons[format];
                return (
                  <Card
                    key={format}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50",
                      selectedFormat === format && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedFormat(format)}
                  >
                    <CardContent className="flex items-start gap-3 p-4">
                      <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium uppercase">{format}</span>
                          <Checkbox
                            checked={selectedFormat === format}
                            onChange={() => setSelectedFormat(format)}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDescriptions[format]}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* List Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select Lists to Export</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelectAllLists(!allListsSelected)}
              >
                {allListsSelected ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {lists.map((list) => (
                <div key={list.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`list-${list.id}`}
                    checked={selectedLists.includes(list.id)}
                    onCheckedChange={(checked) => 
                      handleListSelection(list.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`list-${list.id}`}
                    className="flex-1 text-sm cursor-pointer"
                  >
                    {list.name}
                    {list.description && (
                      <span className="text-muted-foreground ml-2">
                        - {list.description}
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
            
            {selectedListsCount === 0 && (
              <p className="text-sm text-muted-foreground">
                No lists selected. All lists will be exported.
              </p>
            )}
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Options</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCompleted"
                  checked={options.includeCompleted}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeCompleted', checked as boolean)
                  }
                />
                <Label htmlFor="includeCompleted" className="text-sm">
                  Include completed tasks
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDescription"
                  checked={options.includeDescription}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeDescription', checked as boolean)
                  }
                />
                <Label htmlFor="includeDescription" className="text-sm">
                  Include descriptions
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDueDate"
                  checked={options.includeDueDate}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeDueDate', checked as boolean)
                  }
                />
                <Label htmlFor="includeDueDate" className="text-sm">
                  Include due dates
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePriority"
                  checked={options.includePriority}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includePriority', checked as boolean)
                  }
                />
                <Label htmlFor="includePriority" className="text-sm">
                  Include priorities
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCreatedAt"
                  checked={options.includeCreatedAt}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeCreatedAt', checked as boolean)
                  }
                />
                <Label htmlFor="includeCreatedAt" className="text-sm">
                  Include created dates
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeUpdatedAt"
                  checked={options.includeUpdatedAt}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeUpdatedAt', checked as boolean)
                  }
                />
                <Label htmlFor="includeUpdatedAt" className="text-sm">
                  Include updated dates
                </Label>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && preview && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Export Preview</Label>
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
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Preview shows first 3 lists and 10 tasks
                      </p>
                      <div className="space-y-1">
                        {preview.lists.map((list) => (
                          <div key={list.id} className="text-sm">
                            <span className="font-medium">{list.name}</span>
                            {list.description && (
                              <span className="text-muted-foreground ml-2">
                                - {list.description}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
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
            disabled={isExporting || previewLoading}
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
            onClick={handleExport}
            disabled={isExporting || previewLoading}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}