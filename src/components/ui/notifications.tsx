"use client"

import React from "react"
import { CheckCircle, AlertTriangle, Info, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationItemProps {
  notification: Notification
  onDismiss: (id: string) => void
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const { id, type, title, message, persistent, action } = notification

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  }

  const iconStyles = {
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600"
  }

  const Icon = icons[type]

  React.useEffect(() => {
    if (!persistent && notification.duration !== 0) {
      const timer = setTimeout(() => {
        onDismiss(id)
      }, notification.duration || 5000)

      return () => clearTimeout(timer)
    }
  }, [id, persistent, notification.duration, onDismiss])

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-sm transition-all duration-300",
        "animate-in slide-in-from-right-full",
        styles[type]
      )}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconStyles[type])} />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium">{title}</h4>
        {message && (
          <p className="mt-1 text-sm opacity-90">{message}</p>
        )}
        
        {action && (
          <Button
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            className="mt-2 h-auto p-0 text-current hover:text-current hover:bg-transparent hover:underline"
          >
            {action.label}
          </Button>
        )}
      </div>

      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface NotificationContainerProps {
  notifications: Notification[]
  onDismiss: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  className?: string
}

export function NotificationContainer({ 
  notifications, 
  onDismiss, 
  position = 'top-right',
  className 
}: NotificationContainerProps) {
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  }

  if (notifications.length === 0) return null

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-2 w-full max-w-sm",
        positionStyles[position],
        className
      )}
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = React.useState<Notification[]>([])

  const addNotification = React.useCallback((
    notification: Omit<Notification, 'id'>
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification
    }

    setNotifications(prev => [...prev, newNotification])
    return id
  }, [])

  const dismissNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = React.useCallback(() => {
    setNotifications([])
  }, [])

  // Convenience methods
  const success = React.useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'success', title, message, ...options })
  }, [addNotification])

  const error = React.useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'error', title, message, persistent: true, ...options })
  }, [addNotification])

  const warning = React.useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'warning', title, message, ...options })
  }, [addNotification])

  const info = React.useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'info', title, message, ...options })
  }, [addNotification])

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
    success,
    error,
    warning,
    info
  }
}

// Inline notification components
interface InlineNotificationProps {
  type: NotificationType
  title: string
  message?: string
  onDismiss?: () => void
  className?: string
  showIcon?: boolean
}

export function InlineNotification({
  type,
  title,
  message,
  onDismiss,
  className,
  showIcon = true
}: InlineNotificationProps) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  }

  const iconStyles = {
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600"
  }

  const Icon = icons[type]

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        styles[type],
        className
      )}
      role="alert"
    >
      {showIcon && (
        <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconStyles[type])} />
      )}
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{title}</h4>
        {message && (
          <p className="mt-1 text-sm opacity-90">{message}</p>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// Success/Error message components for forms
export function SuccessNotification({ 
  title, 
  message, 
  onDismiss, 
  className 
}: Omit<InlineNotificationProps, 'type'>) {
  return (
    <InlineNotification
      type="success"
      title={title}
      message={message}
      onDismiss={onDismiss}
      className={className}
    />
  )
}

export function ErrorNotification({ 
  title, 
  message, 
  onDismiss, 
  className 
}: Omit<InlineNotificationProps, 'type'>) {
  return (
    <InlineNotification
      type="error"
      title={title}
      message={message}
      onDismiss={onDismiss}
      className={className}
    />
  )
}

// Global notification provider
interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => string
  dismissNotification: (id: string) => void
  clearAll: () => void
  success: (title: string, message?: string, options?: Partial<Notification>) => string
  error: (title: string, message?: string, options?: Partial<Notification>) => string
  warning: (title: string, message?: string, options?: Partial<Notification>) => string
  info: (title: string, message?: string, options?: Partial<Notification>) => string
}

const NotificationContext = React.createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const notificationMethods = useNotifications()

  return (
    <NotificationContext.Provider value={notificationMethods}>
      {children}
      <NotificationContainer
        notifications={notificationMethods.notifications}
        onDismiss={notificationMethods.dismissNotification}
      />
    </NotificationContext.Provider>
  )
}

export function useGlobalNotifications() {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error('useGlobalNotifications must be used within a NotificationProvider')
  }
  return context
}