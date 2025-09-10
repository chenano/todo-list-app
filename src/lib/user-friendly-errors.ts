import { AppError, AuthenticationError, AuthorizationError, ValidationError, NetworkError, TimeoutError, NotFoundError, ConflictError } from './errors'

// User-friendly error message mappings
const ERROR_MESSAGES = {
  // Authentication errors
  'Invalid login credentials': 'The email or password you entered is incorrect. Please check your credentials and try again.',
  'Email not confirmed': 'Please check your email and click the confirmation link before signing in.',
  'Too many requests': 'Too many login attempts. Please wait a moment before trying again.',
  'User not found': 'No account found with this email address. Please check your email or create a new account.',
  'Weak password': 'Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.',
  'Email already registered': 'An account with this email already exists. Please sign in instead or use a different email.',
  'Session expired': 'Your session has expired. Please sign in again to continue.',
  
  // Validation errors
  'Required field': 'This field is required.',
  'Invalid email': 'Please enter a valid email address.',
  'Password too short': 'Password must be at least 8 characters long.',
  'Passwords do not match': 'The passwords you entered do not match.',
  'Invalid date': 'Please enter a valid date.',
  'Title too long': 'Title must be less than 100 characters.',
  'Description too long': 'Description must be less than 500 characters.',
  
  // Network errors
  'Network error': 'Unable to connect to the server. Please check your internet connection and try again.',
  'Connection timeout': 'The request took too long to complete. Please try again.',
  'Server error': 'We\'re experiencing technical difficulties. Please try again in a few moments.',
  'Service unavailable': 'The service is temporarily unavailable. Please try again later.',
  
  // Resource errors
  'List not found': 'The list you\'re looking for doesn\'t exist or has been deleted.',
  'Task not found': 'The task you\'re looking for doesn\'t exist or has been deleted.',
  'Access denied': 'You don\'t have permission to access this resource.',
  'List already exists': 'A list with this name already exists. Please choose a different name.',
  
  // Generic fallbacks
  'Unknown error': 'An unexpected error occurred. Please try again or contact support if the problem persists.',
  'Operation failed': 'The operation could not be completed. Please try again.',
}

// Context-specific error messages
const CONTEXT_MESSAGES = {
  login: {
    title: 'Sign In Failed',
    generic: 'Unable to sign in. Please check your credentials and try again.',
  },
  register: {
    title: 'Registration Failed',
    generic: 'Unable to create your account. Please check your information and try again.',
  },
  'create-list': {
    title: 'Create List Failed',
    generic: 'Unable to create the list. Please try again.',
  },
  'update-list': {
    title: 'Update List Failed',
    generic: 'Unable to update the list. Please try again.',
  },
  'delete-list': {
    title: 'Delete List Failed',
    generic: 'Unable to delete the list. Please try again.',
  },
  'create-task': {
    title: 'Create Task Failed',
    generic: 'Unable to create the task. Please try again.',
  },
  'update-task': {
    title: 'Update Task Failed',
    generic: 'Unable to update the task. Please try again.',
  },
  'delete-task': {
    title: 'Delete Task Failed',
    generic: 'Unable to delete the task. Please try again.',
  },
  'load-data': {
    title: 'Loading Failed',
    generic: 'Unable to load the requested data. Please refresh the page and try again.',
  },
}

export interface UserFriendlyError {
  title: string
  message: string
  suggestion?: string
  canRetry: boolean
  isTemporary: boolean
}

export class UserFriendlyErrorHandler {
  /**
   * Convert any error to a user-friendly format
   */
  static toUserFriendly(error: Error, context?: string): UserFriendlyError {
    // Handle specific error types
    if (error instanceof AuthenticationError) {
      return this.handleAuthError(error, context)
    }
    
    if (error instanceof AuthorizationError) {
      return this.handleAuthzError(error, context)
    }
    
    if (error instanceof ValidationError) {
      return this.handleValidationError(error, context)
    }
    
    if (error instanceof NetworkError) {
      return this.handleNetworkError(error, context)
    }
    
    if (error instanceof TimeoutError) {
      return this.handleTimeoutError(error, context)
    }
    
    if (error instanceof NotFoundError) {
      return this.handleNotFoundError(error, context)
    }
    
    if (error instanceof ConflictError) {
      return this.handleConflictError(error, context)
    }
    
    if (error instanceof AppError) {
      return this.handleAppError(error, context)
    }
    
    // Handle generic errors
    return this.handleGenericError(error, context)
  }

  private static handleAuthError(error: AuthenticationError, context?: string): UserFriendlyError {
    const contextInfo = context ? CONTEXT_MESSAGES[context as keyof typeof CONTEXT_MESSAGES] : null
    
    return {
      title: contextInfo?.title || 'Authentication Failed',
      message: this.getMessageForError(error.message) || contextInfo?.generic || 'Authentication failed. Please try again.',
      suggestion: 'Please check your credentials and try signing in again.',
      canRetry: true,
      isTemporary: false
    }
  }

  private static handleAuthzError(error: AuthorizationError, context?: string): UserFriendlyError {
    return {
      title: 'Access Denied',
      message: this.getMessageForError(error.message) || 'You don\'t have permission to perform this action.',
      suggestion: 'Please sign in with an account that has the necessary permissions.',
      canRetry: false,
      isTemporary: false
    }
  }

  private static handleValidationError(error: ValidationError, context?: string): UserFriendlyError {
    const contextInfo = context ? CONTEXT_MESSAGES[context as keyof typeof CONTEXT_MESSAGES] : null
    
    let message = this.getMessageForError(error.message)
    
    // Handle field-specific validation errors
    if (error.validationErrors) {
      const fieldErrors = Object.entries(error.validationErrors)
        .map(([field, errors]) => {
          const fieldName = field.charAt(0).toUpperCase() + field.slice(1)
          return `${fieldName}: ${errors.join(', ')}`
        })
        .join('; ')
      message = fieldErrors
    }
    
    return {
      title: contextInfo?.title || 'Validation Error',
      message: message || contextInfo?.generic || 'Please check your input and try again.',
      suggestion: 'Please correct the highlighted fields and submit again.',
      canRetry: true,
      isTemporary: false
    }
  }

  private static handleNetworkError(error: NetworkError, context?: string): UserFriendlyError {
    return {
      title: 'Connection Problem',
      message: this.getMessageForError(error.message) || 'Unable to connect to the server.',
      suggestion: 'Please check your internet connection and try again.',
      canRetry: true,
      isTemporary: true
    }
  }

  private static handleTimeoutError(error: TimeoutError, context?: string): UserFriendlyError {
    return {
      title: 'Request Timeout',
      message: this.getMessageForError(error.message) || 'The request took too long to complete.',
      suggestion: 'Please try again. If the problem persists, check your internet connection.',
      canRetry: true,
      isTemporary: true
    }
  }

  private static handleNotFoundError(error: NotFoundError, context?: string): UserFriendlyError {
    const contextInfo = context ? CONTEXT_MESSAGES[context as keyof typeof CONTEXT_MESSAGES] : null
    
    return {
      title: 'Not Found',
      message: this.getMessageForError(error.message) || 'The requested resource was not found.',
      suggestion: 'Please check the URL or navigate back to the main page.',
      canRetry: false,
      isTemporary: false
    }
  }

  private static handleConflictError(error: ConflictError, context?: string): UserFriendlyError {
    const contextInfo = context ? CONTEXT_MESSAGES[context as keyof typeof CONTEXT_MESSAGES] : null
    
    return {
      title: 'Conflict',
      message: this.getMessageForError(error.message) || 'A conflict occurred with existing data.',
      suggestion: 'Please try using a different name or refresh the page to see the latest data.',
      canRetry: true,
      isTemporary: false
    }
  }

  private static handleAppError(error: AppError, context?: string): UserFriendlyError {
    const contextInfo = context ? CONTEXT_MESSAGES[context as keyof typeof CONTEXT_MESSAGES] : null
    
    return {
      title: contextInfo?.title || 'Error',
      message: this.getMessageForError(error.message) || contextInfo?.generic || error.message,
      suggestion: error.isOperational ? 'Please try again.' : 'Please contact support if this problem persists.',
      canRetry: error.isOperational,
      isTemporary: error.isOperational
    }
  }

  private static handleGenericError(error: Error, context?: string): UserFriendlyError {
    const contextInfo = context ? CONTEXT_MESSAGES[context as keyof typeof CONTEXT_MESSAGES] : null
    
    return {
      title: contextInfo?.title || 'Unexpected Error',
      message: contextInfo?.generic || 'An unexpected error occurred.',
      suggestion: 'Please try again or contact support if the problem persists.',
      canRetry: true,
      isTemporary: true
    }
  }

  private static getMessageForError(errorMessage: string): string | null {
    // Direct match
    if (ERROR_MESSAGES[errorMessage as keyof typeof ERROR_MESSAGES]) {
      return ERROR_MESSAGES[errorMessage as keyof typeof ERROR_MESSAGES]
    }
    
    // Partial matches
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return message
      }
    }
    
    return null
  }

  /**
   * Get action suggestions based on error type and context
   */
  static getActionSuggestions(error: Error, context?: string): string[] {
    const suggestions: string[] = []
    
    if (error instanceof NetworkError || error instanceof TimeoutError) {
      suggestions.push('Check your internet connection')
      suggestions.push('Try again in a few moments')
      suggestions.push('Refresh the page')
    } else if (error instanceof AuthenticationError) {
      suggestions.push('Check your email and password')
      suggestions.push('Try resetting your password')
      suggestions.push('Make sure your account is verified')
    } else if (error instanceof ValidationError) {
      suggestions.push('Check the highlighted fields')
      suggestions.push('Make sure all required fields are filled')
      suggestions.push('Verify the format of your input')
    } else if (error instanceof AuthorizationError) {
      suggestions.push('Sign in with the correct account')
      suggestions.push('Contact an administrator for access')
    } else {
      suggestions.push('Try again')
      suggestions.push('Refresh the page')
      suggestions.push('Contact support if the problem persists')
    }
    
    return suggestions
  }

  /**
   * Determine if an error should show a retry button
   */
  static shouldShowRetry(error: Error): boolean {
    if (error instanceof AuthorizationError || error instanceof NotFoundError) {
      return false
    }
    
    if (error instanceof ValidationError && error.validationErrors) {
      return false // User needs to fix validation errors first
    }
    
    return true
  }

  /**
   * Get appropriate retry delay based on error type
   */
  static getRetryDelay(error: Error, attempt: number): number {
    const baseDelay = 1000 // 1 second
    
    if (error instanceof NetworkError || error instanceof TimeoutError) {
      // Exponential backoff for network errors
      return Math.min(baseDelay * Math.pow(2, attempt), 30000) // Max 30 seconds
    }
    
    if (error instanceof AppError && error.statusCode === 429) {
      // Rate limiting - longer delay
      return Math.min(baseDelay * Math.pow(3, attempt), 60000) // Max 1 minute
    }
    
    return baseDelay
  }
}

// Convenience functions
export const toUserFriendlyError = (error: Error, context?: string): UserFriendlyError => {
  return UserFriendlyErrorHandler.toUserFriendly(error, context)
}

export const getErrorSuggestions = (error: Error, context?: string): string[] => {
  return UserFriendlyErrorHandler.getActionSuggestions(error, context)
}

export const shouldShowRetryButton = (error: Error): boolean => {
  return UserFriendlyErrorHandler.shouldShowRetry(error)
}

export const getRetryDelay = (error: Error, attempt: number): number => {
  return UserFriendlyErrorHandler.getRetryDelay(error, attempt)
}