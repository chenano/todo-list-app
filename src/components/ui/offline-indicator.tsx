// Offline status indicator component
'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useOfflineOperations } from '@/hooks/useOfflineOperations';
import { Button } from './button';
import { Badge } from './badge';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Separator } from './separator';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function OfflineIndicator({ className, showDetails = true }: OfflineIndicatorProps) {
  const { isOnline, isOffline, lastOnline, networkInfo } = useOfflineStatus();
  const { queueStatus, forceSync, clearErrors } = useOfflineOperations();
  const [showPopover, setShowPopover] = useState(false);

  // Auto-hide popover when coming online
  useEffect(() => {
    if (isOnline && showPopover) {
      const timer = setTimeout(() => setShowPopover(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showPopover]);

  const getStatusIcon = () => {
    if (queueStatus.isProcessing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (isOffline) {
      return <WifiOff className="h-4 w-4" />;
    }
    
    if (queueStatus.pendingOperations > 0) {
      return <CloudOff className="h-4 w-4" />;
    }
    
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (queueStatus.isProcessing) {
      return 'text-blue-600 dark:text-blue-400';
    }
    
    if (isOffline) {
      return 'text-red-600 dark:text-red-400';
    }
    
    if (queueStatus.pendingOperations > 0) {
      return 'text-yellow-600 dark:text-yellow-400';
    }
    
    return 'text-green-600 dark:text-green-400';
  };

  const getStatusText = () => {
    if (queueStatus.isProcessing) {
      return 'Syncing...';
    }
    
    if (isOffline) {
      return 'Offline';
    }
    
    if (queueStatus.pendingOperations > 0) {
      return `${queueStatus.pendingOperations} pending`;
    }
    
    return 'Online';
  };

  const formatLastOnline = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatNetworkInfo = () => {
    if (!networkInfo.effectiveType) return null;
    
    const parts = [networkInfo.effectiveType.toUpperCase()];
    if (networkInfo.downlink) {
      parts.push(`${networkInfo.downlink} Mbps`);
    }
    if (networkInfo.rtt) {
      parts.push(`${networkInfo.rtt}ms`);
    }
    
    return parts.join(' • ');
  };

  if (!showDetails) {
    return (
      <div className={cn('flex items-center gap-1', getStatusColor(), className)}>
        {getStatusIcon()}
      </div>
    );
  }

  return (
    <Popover open={showPopover} onOpenChange={setShowPopover}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'flex items-center gap-2 h-8 px-2',
            getStatusColor(),
            className
          )}
        >
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
          {queueStatus.pendingOperations > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {queueStatus.pendingOperations}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Cloud className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <CloudOff className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span className="font-medium">
                {isOnline ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {isOnline && (
              <Badge variant="outline" className="text-xs">
                {formatNetworkInfo() || 'Online'}
              </Badge>
            )}
          </div>

          {/* Last Online */}
          {isOffline && lastOnline && (
            <div className="text-sm text-muted-foreground">
              Last online: {formatLastOnline(lastOnline)}
            </div>
          )}

          <Separator />

          {/* Sync Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sync Status</span>
              {queueStatus.isProcessing && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
            </div>
            
            {queueStatus.pendingOperations > 0 ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {queueStatus.pendingOperations} operation(s) pending sync
                </div>
                {isOnline && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={forceSync}
                    disabled={queueStatus.isProcessing}
                    className="w-full"
                  >
                    {queueStatus.isProcessing ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      'Sync Now'
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                All changes synced
              </div>
            )}

            {queueStatus.lastSync && (
              <div className="text-xs text-muted-foreground">
                Last sync: {formatLastOnline(queueStatus.lastSync)}
              </div>
            )}
          </div>

          {/* Errors */}
          {queueStatus.errors.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium">Sync Errors</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearErrors}
                    className="h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
                <div className="space-y-1">
                  {queueStatus.errors.map((error, index) => (
                    <div
                      key={index}
                      className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded"
                    >
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Offline Mode Info */}
          {isOffline && (
            <>
              <Separator />
              <div className="text-xs text-muted-foreground">
                You're working offline. Changes will sync when you're back online.
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}