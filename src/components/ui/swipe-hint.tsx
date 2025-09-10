"use client"

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check, Trash2, X } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { cn } from '@/lib/utils'

interface SwipeHintProps {
  onDismiss?: () => void
  className?: string
}

export function SwipeHint({ onDismiss, className }: SwipeHintProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenShown, setHasBeenShown] = useState(false)

  useEffect(() => {
    // Check if user has seen the hint before
    const hasSeenHint = localStorage.getItem('swipe-hint-dismissed')
    if (!hasSeenHint && !hasBeenShown) {
      setHasBeenShown(true)
      // Show hint after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [hasBeenShown])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('swipe-hint-dismissed', 'true')
    onDismiss?.()
  }

  if (!isVisible) return null

  return (
    <Card className={cn(
      'fixed bottom-4 left-4 right-4 z-50 border-2 border-primary/20 bg-background/95 backdrop-blur-sm shadow-lg md:hidden',
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">Swipe gestures available!</span>
            </div>
            
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3" />
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                <span>Swipe right to complete task</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <ChevronLeft className="h-3 w-3" />
                  <Trash2 className="h-3 w-3 text-red-600" />
                </div>
                <span>Swipe left to delete task</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss hint</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}