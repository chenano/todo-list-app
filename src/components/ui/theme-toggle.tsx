'use client';

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';
import { withThemeTransition } from '@/lib/theme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: Sun,
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: Moon,
    },
    {
      value: 'system' as const,
      label: 'System',
      icon: Monitor,
    },
  ];

  const currentThemeOption = themeOptions.find(option => option.value === theme.mode);
  const CurrentIcon = currentThemeOption?.icon || Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={withThemeTransition(
            'h-9 w-9 px-0 hover:bg-accent hover:text-accent-foreground'
          )}
          aria-label={`Current theme: ${currentThemeOption?.label || 'System'}. Click to change theme.`}
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={withThemeTransition()}>
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = theme.mode === option.value;
          
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={withThemeTransition(
                'cursor-pointer',
                isSelected && 'bg-accent text-accent-foreground'
              )}
              aria-label={`Switch to ${option.label.toLowerCase()} theme`}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span>{option.label}</span>
              {isSelected && (
                <span className="ml-auto text-xs opacity-60">
                  {theme.mode === 'system' ? `(${theme.systemTheme})` : ''}
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple toggle button variant for cases where dropdown is not needed
export function SimpleThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  const isDark = theme.resolvedTheme === 'dark';
  const Icon = isDark ? Sun : Moon;
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={withThemeTransition(
        'h-9 w-9 px-0 hover:bg-accent hover:text-accent-foreground'
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}