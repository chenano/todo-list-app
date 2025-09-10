"use client"

import { useRef, useCallback, TouchEvent } from 'react'

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  preventScroll?: boolean
}

interface TouchPosition {
  x: number
  y: number
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  preventScroll = false,
}: SwipeGestureOptions) {
  const touchStart = useRef<TouchPosition | null>(null)
  const touchEnd = useRef<TouchPosition | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchEnd.current = null
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventScroll && touchStart.current) {
      const currentTouch = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      }
      
      const deltaX = Math.abs(currentTouch.x - touchStart.current.x)
      const deltaY = Math.abs(currentTouch.y - touchStart.current.y)
      
      // If horizontal swipe is more significant than vertical, prevent scroll
      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault()
      }
    }
    
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    }
  }, [preventScroll])

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return

    const deltaX = touchStart.current.x - touchEnd.current.x
    const deltaY = touchStart.current.y - touchEnd.current.y
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // Only trigger swipe if horizontal movement is greater than vertical
    if (absDeltaX > absDeltaY && absDeltaX > threshold) {
      if (deltaX > 0) {
        // Swiped left
        onSwipeLeft?.()
      } else {
        // Swiped right
        onSwipeRight?.()
      }
    }

    // Reset touch positions
    touchStart.current = null
    touchEnd.current = null
  }, [onSwipeLeft, onSwipeRight, threshold])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }
}