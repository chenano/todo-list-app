// Custom error types for the Todo List application

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication related errors
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

export class SessionExpiredError extends AppError {
  constructor(message: string = 'Session has expired') {
    super(message, 'SESSION_EXPIRED', 401);
  }
}

// Validation related errors
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly validationErrors?: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    field?: string,
    validationErrors?: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.field = field;
    this.validationErrors = validationErrors;
  }
}

// Database related errors
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 'DATABASE_ERROR', 500);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 'CONFLICT', 409);
  }
}

// Network related errors
export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 0);
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Request timeout') {
    super(message, 'TIMEOUT_ERROR', 408);
  }
}

// Rate limiting errors
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
  }
}

// Error handling utilities
export const errorUtils = {
  /**
   * Check if error is an operational error (expected/handled)
   */
  isOperationalError: (error: Error): boolean => {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  },

  /**
   * Extract user-friendly error message
   */
  getUserMessage: (error: Error): string => {
    if (error instanceof AppError) {
      return error.message;
    }

    // Handle common error patterns
    if (error.message.includes('fetch')) {
      return 'Network connection failed. Please check your internet connection.';
    }

    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    // Default fallback
    return 'An unexpected error occurred. Please try again.';
  },

  /**
   * Get error code for logging/tracking
   */
  getErrorCode: (error: Error): string => {
    if (error instanceof AppError) {
      return error.code;
    }
    return 'UNKNOWN_ERROR';
  },

  /**
   * Format validation errors for display
   */
  formatValidationErrors: (errors: Record<string, string[]>): string => {
    const messages = Object.entries(errors)
      .map(([field, fieldErrors]) => {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        return `${fieldName}: ${fieldErrors.join(', ')}`;
      });
    return messages.join('; ');
  },

  /**
   * Create error from Supabase error
   */
  fromSupabaseError: (error: any): AppError => {
    const message = error?.message || 'Database operation failed';
    const code = error?.code || 'SUPABASE_ERROR';

    // Map common Supabase error codes
    switch (code) {
      case 'PGRST116':
        return new NotFoundError('Resource not found');
      case 'PGRST301':
        return new AuthorizationError('Insufficient permissions');
      case '23505':
        return new ConflictError('Resource already exists');
      case '23503':
        return new ValidationError('Invalid reference');
      case '42501':
        return new AuthorizationError('Access denied');
      default:
        return new DatabaseError(message);
    }
  },

  /**
   * Create error from fetch response
   */
  fromFetchError: (response: Response, message?: string): AppError => {
    const defaultMessage = message || `Request failed with status ${response.status}`;
    
    switch (response.status) {
      case 400:
        return new ValidationError(defaultMessage);
      case 401:
        return new AuthenticationError(defaultMessage);
      case 403:
        return new AuthorizationError(defaultMessage);
      case 404:
        return new NotFoundError(defaultMessage);
      case 409:
        return new ConflictError(defaultMessage);
      case 429:
        return new RateLimitError(defaultMessage);
      case 408:
        return new TimeoutError(defaultMessage);
      default:
        return new AppError(defaultMessage, 'HTTP_ERROR', response.status);
    }
  },

  /**
   * Log error with appropriate level
   */
  logError: (error: Error, context?: Record<string, any>): void => {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: errorUtils.getErrorCode(error),
      isOperational: errorUtils.isOperationalError(error),
      context,
      timestamp: new Date().toISOString(),
    };

    if (errorUtils.isOperationalError(error)) {
      console.warn('Operational error:', errorInfo);
    } else {
      console.error('Unexpected error:', errorInfo);
    }
  },

  /**
   * Retry function with exponential backoff
   */
  withRetry: async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry operational errors that shouldn't be retried
        if (error instanceof ValidationError || 
            error instanceof AuthenticationError || 
            error instanceof AuthorizationError ||
            error instanceof NotFoundError) {
          throw error;
        }

        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  },
};

// Business logic errors
export class DuplicateResourceError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} already exists`, 'DUPLICATE_RESOURCE', 409);
  }
}

export class InvalidOperationError extends AppError {
  constructor(message: string = 'Invalid operation') {
    super(message, 'INVALID_OPERATION', 400);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string = 'Quota exceeded') {
    super(message, 'QUOTA_EXCEEDED', 429);
  }
}

// File operation errors
export class FileUploadError extends AppError {
  constructor(message: string = 'File upload failed') {
    super(message, 'FILE_UPLOAD_ERROR', 400);
  }
}

export class FileSizeError extends AppError {
  constructor(maxSize: string) {
    super(`File size exceeds maximum allowed size of ${maxSize}`, 'FILE_SIZE_ERROR', 400);
  }
}

export class FileTypeError extends AppError {
  constructor(allowedTypes: string[]) {
    super(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`, 'FILE_TYPE_ERROR', 400);
  }
}

// Error boundary helper for React components
export interface ErrorInfo {
  componentStack: string;
}

export const createErrorBoundaryHandler = (
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  return (error: Error, errorInfo: ErrorInfo) => {
    errorUtils.logError(error, { componentStack: errorInfo.componentStack });
    onError?.(error, errorInfo);
  };
};

// Error recovery strategies
export const errorRecovery = {
  /**
   * Create a safe async function that handles errors gracefully
   */
  createSafeAsync: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    fallback?: R,
    onError?: (error: Error) => void
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      try {
        return await fn(...args);
      } catch (error) {
        const appError = error instanceof AppError ? error : new AppError(
          error instanceof Error ? error.message : 'Unknown error'
        );
        
        errorUtils.logError(appError);
        onError?.(appError);
        
        return fallback;
      }
    };
  },

  /**
   * Create a circuit breaker for repeated failures
   */
  createCircuitBreaker: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    threshold: number = 5,
    timeout: number = 60000
  ) => {
    let failures = 0;
    let lastFailureTime = 0;
    let isOpen = false;

    return async (...args: T): Promise<R> => {
      const now = Date.now();

      // Reset if timeout has passed
      if (isOpen && now - lastFailureTime > timeout) {
        isOpen = false;
        failures = 0;
      }

      // Reject if circuit is open
      if (isOpen) {
        throw new AppError('Service temporarily unavailable', 'CIRCUIT_BREAKER_OPEN', 503);
      }

      try {
        const result = await fn(...args);
        // Reset on success
        failures = 0;
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;

        if (failures >= threshold) {
          isOpen = true;
        }

        throw error;
      }
    };
  },
};