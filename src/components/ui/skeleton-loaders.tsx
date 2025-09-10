"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "./card"
import { Skeleton } from "./skeleton"

// Base skeleton component (if not already exists)
export function BaseSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Task Item Skeleton
export function TaskItemSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-3 border rounded-lg">
      <Skeleton className="h-4 w-4 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
    </div>
  )
}

// Task List Skeleton
export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TaskItemSkeleton key={i} />
      ))}
    </div>
  )
}

// List Card Skeleton
export function ListCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

// List Grid Skeleton
export function ListGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ListCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Form Skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Stats or filters */}
      <div className="flex space-x-4">
        <Skeleton className="h-20 w-32 rounded-lg" />
        <Skeleton className="h-20 w-32 rounded-lg" />
        <Skeleton className="h-20 w-32 rounded-lg" />
      </div>
      
      {/* Main content */}
      <ListGridSkeleton />
    </div>
  )
}

// Page Skeleton
export function PageSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <TaskListSkeleton count={8} />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// Table Skeleton
export function TableSkeleton({ 
  rows = 5, 
  columns = 4 
}: { 
  rows?: number
  columns?: number 
}) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Content Skeleton with different layouts
interface ContentSkeletonProps {
  layout?: 'list' | 'grid' | 'table' | 'form' | 'dashboard' | 'page'
  count?: number
  className?: string
}

export function ContentSkeleton({ 
  layout = 'list', 
  count = 5, 
  className 
}: ContentSkeletonProps) {
  const skeletonComponents = {
    list: <TaskListSkeleton count={count} />,
    grid: <ListGridSkeleton count={count} />,
    table: <TableSkeleton rows={count} />,
    form: <FormSkeleton />,
    dashboard: <DashboardSkeleton />,
    page: <PageSkeleton />
  }

  return (
    <div className={cn("animate-pulse", className)}>
      {skeletonComponents[layout]}
    </div>
  )
}

// Loading overlay for existing content
interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  className?: string
  blur?: boolean
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  className,
  blur = true 
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "transition-all duration-200",
        isLoading && blur && "blur-sm opacity-50"
      )}>
        {children}
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Progressive loading component
interface ProgressiveLoadingProps {
  stages: Array<{
    name: string
    duration?: number
    component: React.ReactNode
  }>
  finalContent: React.ReactNode
  className?: string
}

export function ProgressiveLoading({ 
  stages, 
  finalContent, 
  className 
}: ProgressiveLoadingProps) {
  const [currentStage, setCurrentStage] = React.useState(0)
  const [isComplete, setIsComplete] = React.useState(false)

  React.useEffect(() => {
    if (currentStage < stages.length) {
      const timer = setTimeout(() => {
        if (currentStage === stages.length - 1) {
          setIsComplete(true)
        } else {
          setCurrentStage(prev => prev + 1)
        }
      }, stages[currentStage]?.duration || 1000)

      return () => clearTimeout(timer)
    }
  }, [currentStage, stages])

  if (isComplete) {
    return <>{finalContent}</>
  }

  return (
    <div className={cn("transition-all duration-300", className)}>
      {stages[currentStage]?.component}
    </div>
  )
}