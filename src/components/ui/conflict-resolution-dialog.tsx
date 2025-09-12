// Conflict resolution dialog component
'use client';

import { useState } from 'react';
import { Clock, User, Smartphone, Monitor, Merge } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SyncConflict, ConflictResolution } from '@/lib/sync-manager';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { Separator } from './separator';
import { ScrollArea } from './scroll-area';

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: SyncConflict[];
  onResolve: (resolutions: ConflictResolution[]) => Promise<void>;
  isResolving?: boolean;
}

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflicts,
  onResolve,
  isResolving = false
}: ConflictResolutionDialogProps) {
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(new Map());
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);

  const currentConflict = conflicts[currentConflictIndex];
  const hasNextConflict = currentConflictIndex < conflicts.length - 1;
  const hasPrevConflict = currentConflictIndex > 0;
  const allResolved = resolutions.size === conflicts.length;

  const handleResolutionChange = (conflictId: string, resolution: ConflictResolution) => {
    setResolutions(prev => new Map(prev.set(conflictId, resolution)));
  };

  const handleNext = () => {
    if (hasNextConflict) {
      setCurrentConflictIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (hasPrevConflict) {
      setCurrentConflictIndex(prev => prev - 1);
    }
  };

  const handleResolveAll = async () => {
    const resolutionArray = Array.from(resolutions.values());
    await onResolve(resolutionArray);
    setResolutions(new Map());
    setCurrentConflictIndex(0);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getFieldDisplayName = (field: string) => {
    const fieldNames: Record<string, string> = {
      name: 'Name',
      title: 'Title',
      description: 'Description',
      completed: 'Status',
      priority: 'Priority',
      due_date: 'Due Date',
      list_id: 'List'
    };
    return fieldNames[field] || field;
  };

  const renderFieldValue = (field: string, value: any) => {
    switch (field) {
      case 'completed':
        return value ? 'Completed' : 'Incomplete';
      case 'priority':
        return (
          <Badge variant={value === 'high' ? 'destructive' : value === 'medium' ? 'default' : 'secondary'}>
            {value}
          </Badge>
        );
      case 'due_date':
        return value ? new Date(value).toLocaleDateString() : 'No due date';
      default:
        return value || 'Empty';
    }
  };

  if (!currentConflict) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Resolve Sync Conflicts
          </DialogTitle>
          <DialogDescription>
            {conflicts.length > 1 ? (
              <>
                Conflict {currentConflictIndex + 1} of {conflicts.length} - 
                Choose which version to keep for each conflicting field.
              </>
            ) : (
              'Choose which version to keep for each conflicting field.'
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Conflict Overview */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="outline">
                  {currentConflict.type === 'list' ? 'List' : 'Task'}
                </Badge>
                <span className="font-medium">
                  {currentConflict.localData.name || currentConflict.localData.title}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {currentConflict.conflictFields.length} conflicting field(s)
              </div>
            </div>

            {/* Conflict Fields */}
            <div className="space-y-4">
              {currentConflict.conflictFields.map((field) => (
                <div key={field} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">{getFieldDisplayName(field)}</h4>
                    <Badge variant="secondary" className="text-xs">
                      Conflicting
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Local Version */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-600">Your Version</span>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimestamp(currentConflict.localTimestamp)}
                        </Badge>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer transition-colors"
                           onClick={() => handleResolutionChange(currentConflict.id, {
                             conflictId: currentConflict.id,
                             resolution: 'local'
                           })}>
                        <div className="text-sm">
                          {renderFieldValue(field, currentConflict.localData[field])}
                        </div>
                      </div>
                      <Button
                        variant={resolutions.get(currentConflict.id)?.resolution === 'local' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => handleResolutionChange(currentConflict.id, {
                          conflictId: currentConflict.id,
                          resolution: 'local'
                        })}
                      >
                        Use Your Version
                      </Button>
                    </div>

                    {/* Remote Version */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-600">Server Version</span>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimestamp(currentConflict.remoteTimestamp)}
                        </Badge>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded border-2 border-transparent hover:border-green-200 dark:hover:border-green-800 cursor-pointer transition-colors"
                           onClick={() => handleResolutionChange(currentConflict.id, {
                             conflictId: currentConflict.id,
                             resolution: 'remote'
                           })}>
                        <div className="text-sm">
                          {renderFieldValue(field, currentConflict.remoteData[field])}
                        </div>
                      </div>
                      <Button
                        variant={resolutions.get(currentConflict.id)?.resolution === 'remote' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => handleResolutionChange(currentConflict.id, {
                          conflictId: currentConflict.id,
                          resolution: 'remote'
                        })}
                      >
                        Use Server Version
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resolution Summary */}
            {resolutions.has(currentConflict.id) && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Resolution Selected</span>
                </div>
                <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                  {resolutions.get(currentConflict.id)?.resolution === 'local' 
                    ? 'Your version will be used'
                    : 'Server version will be used'
                  }
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {conflicts.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={!hasPrevConflict}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentConflictIndex + 1} of {conflicts.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={!hasNextConflict}
                >
                  Next
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isResolving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolveAll}
              disabled={!allResolved || isResolving}
            >
              {isResolving ? 'Resolving...' : `Resolve ${conflicts.length} Conflict${conflicts.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}