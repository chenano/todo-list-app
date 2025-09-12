// Sync progress indicator component
'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SyncResult } from '@/lib/sync-manager';
import { Progress } from './progress';
import { Badge } from './badge';
import { Button } from './button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

interface SyncProgressProps {
  isVisible: boolean;
  result: SyncResult | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function SyncProgress({
  isVisible,
  result,
  onRetry,
  onDismiss,
  className
}: SyncProgressProps) {
  const [progress, setProgress] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Animate progress when syncing
  useEffect(() => {
    if (isVisible && !result) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      return () => clearInterval(interval);
    } else if (result) {
      setProgress(100);
    }
  }, [isVisible, result]);

  // Reset progress when hidden
  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setShowDetails(false);
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const getStatusIcon = () => {
    if (!result) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }

    if (result.success && result.conflicts.length === 0) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }

    if (result.conflicts.length > 0) {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }

    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusText = () => {
    if (!result) {
      return 'Syncing your changes...';
    }

    if (result.success && result.conflicts.length === 0) {
      return `Successfully synced ${result.synced} item${result.synced !== 1 ? 's' : ''}`;
    }

    if (result.conflicts.length > 0) {
      return `Sync completed with ${result.conflicts.length} conflict${result.conflicts.length !== 1 ? 's' : ''}`;
    }

    return `Sync failed - ${result.failed} error${result.failed !== 1 ? 's' : ''}`;
  };

  const getStatusColor = () => {
    if (!result) {
      return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20';
    }

    if (result.success && result.conflicts.length === 0) {
      return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20';
    }

    if (result.conflicts.length > 0) {
      return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20';
    }

    return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20';
  };

  const hasDetails = result && (result.errors.length > 0 || result.conflicts.length > 0);

  return (
    <div className={cn(
      'fixed bottom-4 right-4 w-96 border rounded-lg shadow-lg z-50 transition-all duration-300',
      getStatusColor(),
      className
    )}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium text-sm">{getStatusText()}</span>
          </div>
          {onDismiss && result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        {!result && (
          <div className="mb-3">
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Summary Badges */}
        {result && (
          <div className="flex items-center gap-2 mb-3">
            {result.synced > 0 && (
              <Badge variant="secondary" className="text-xs">
                {result.synced} synced
              </Badge>
            )}
            {result.failed > 0 && (
              <Badge variant="destructive" className="text-xs">
                {result.failed} failed
              </Badge>
            )}
            {result.conflicts.length > 0 && (
              <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-600">
                {result.conflicts.length} conflict{result.conflicts.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}

        {/* Details Section */}
        {hasDetails && (
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto">
                <span className="text-xs text-muted-foreground">
                  {showDetails ? 'Hide details' : 'Show details'}
                </span>
                <span className={cn(
                  'text-xs transition-transform',
                  showDetails && 'rotate-180'
                )}>
                  ▼
                </span>
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3 space-y-2">
              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-red-600 dark:text-red-400">
                    Errors:
                  </div>
                  {result.errors.slice(0, 3).map((error, index) => (
                    <div key={index} className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/40 p-2 rounded">
                      {error}
                    </div>
                  ))}
                  {result.errors.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      ... and {result.errors.length - 3} more
                    </div>
                  )}
                </div>
              )}

              {/* Conflicts */}
              {result.conflicts.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                    Conflicts:
                  </div>
                  {result.conflicts.slice(0, 3).map((conflict, index) => (
                    <div key={index} className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/40 p-2 rounded">
                      {conflict.type === 'list' ? 'List' : 'Task'}: {conflict.localData.name || conflict.localData.title}
                      <div className="text-xs text-muted-foreground mt-1">
                        Fields: {conflict.conflictFields.join(', ')}
                      </div>
                    </div>
                  ))}
                  {result.conflicts.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      ... and {result.conflicts.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Actions */}
        {result && !result.success && onRetry && (
          <div className="mt-3 pt-3 border-t border-current/20">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="w-full"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Retry Sync
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}