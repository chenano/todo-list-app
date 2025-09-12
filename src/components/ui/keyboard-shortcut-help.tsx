'use client';

import React from 'react';
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutContext';
import { formatShortcut } from '@/lib/keyboard-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function KeyboardShortcutHelp() {
  const { showHelp, setShowHelp, getShortcutGroups } = useKeyboardShortcuts();
  const shortcutGroups = getShortcutGroups();

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            View and learn all available keyboard shortcuts for faster navigation and productivity.
          </DialogDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={() => setShowHelp(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {shortcutGroups.map((group) => (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold capitalize">{group.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {group.shortcuts.length} shortcuts
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {group.shortcuts
                    .filter(shortcut => shortcut.enabled !== false)
                    .map((shortcut) => (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <span className="text-sm text-muted-foreground">
                          {shortcut.description}
                        </span>
                        <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-background border rounded">
                          {formatShortcut(shortcut)}
                        </kbd>
                      </div>
                    ))}
                </div>
                
                {group.id !== shortcutGroups[shortcutGroups.length - 1].id && (
                  <Separator className="my-4" />
                )}
              </div>
            ))}
            
            {shortcutGroups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Keyboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No keyboard shortcuts available</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">F1</kbd> or{' '}
            <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">?</kbd> to toggle this help
          </p>
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">Esc</kbd> to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ShortcutTooltipProps {
  shortcut: string;
  description: string;
  children: React.ReactNode;
}

export function ShortcutTooltip({ shortcut, description, children }: ShortcutTooltipProps) {
  return (
    <div className="group relative">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        <div className="flex items-center gap-2">
          <span>{description}</span>
          <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">
            {shortcut}
          </kbd>
        </div>
      </div>
    </div>
  );
}

interface ShortcutBadgeProps {
  shortcut: string;
  className?: string;
}

export function ShortcutBadge({ shortcut, className }: ShortcutBadgeProps) {
  return (
    <kbd className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono bg-muted text-muted-foreground border rounded ${className}`}>
      {shortcut}
    </kbd>
  );
}