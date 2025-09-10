import { errorUtils, NetworkError, TimeoutError, AppError } from './errors'

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryCondition?: (error: Error) => boolean
}

export interface NetworkErrorHandlerConfig {
  timeout: number
  retryConfig: RetryConfig
  onRetry?: (attempt: number, error: Error) => void
  onMaxRetriesReached?: (error: Error) => void
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error instanceof NetworkError || error instanceof TimeoutError) {
      return true
    }
    if (error instanceof AppError) {
      return error.statusCode >= 500 || error.statusCode === 0
    }
    return false
  }
}

const DEFAULT_CONFIG: NetworkErrorHandlerConfig = {
  timeout: 30000,
  retryConfig: DEFAULT_RETRY_CONFIG
}

export class NetworkErrorHandler {
  private config: NetworkErrorHandlerConfig

  constructor(config: Partial<NetworkErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    if (config.retryConfig) {
      this.config.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retryConfig }
    }
  }

  /**
   * Execute a network request with retry logic and timeout
   */
  async execute<T>(
    requestFn: () => Promise<T>,
    customConfig?: Partial<NetworkErrorHandlerConfig>
  ): Promise<T> {
    const config = customConfig ? { ...this.config, ...customConfig } : this.config
    
    return this.executeWithRetry(requestFn, config)
  }

  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    config: NetworkErrorHandlerConfig
  ): Promise<T> {
    let lastError: Error
    const { retryConfig } = config

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // Add timeout to the request
        const result = await this.withTimeout(requestFn(), config.timeout)
        return result
      } catch (error) {
        lastError = error as Error
        
        // Don't retry if this is the last attempt
        if (attempt === retryConfig.maxRetries) {
          config.onMaxRetriesReached?.(lastError)
          break
        }

        // Check if we should retry this error
        if (!retryConfig.retryCondition?.(lastError)) {
          break
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt),
          retryConfig.maxDelay
        )
        const jitteredDelay = delay + Math.random() * 1000

        config.onRetry?.(attempt + 1, lastError)
        
        // Wait before retrying
        await this.delay(jitteredDelay)
      }
    }

    throw lastError!
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`Request timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })

    return Promise.race([promise, timeoutPromise])
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Create a fetch wrapper with error handling and retries
   */
  createFetchWrapper() {
    return async (url: string, options: RequestInit = {}): Promise<Response> => {
      return this.execute(async () => {
        try {
          const response = await fetch(url, options)
          
          if (!response.ok) {
            throw errorUtils.fromFetchError(response)
          }
          
          return response
        } catch (error) {
          if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new NetworkError('Network request failed. Please check your connection.')
          }
          throw error
        }
      })
    }
  }

  /**
   * Create a Supabase client wrapper with error handling
   */
  createSupabaseWrapper<T>(supabaseCall: () => Promise<{ data: T; error: any }>) {
    return this.execute(async () => {
      const { data, error } = await supabaseCall()
      
      if (error) {
        throw errorUtils.fromSupabaseError(error)
      }
      
      return data
    })
  }
}

// Global network error handler instance
export const networkErrorHandler = new NetworkErrorHandler()

// Convenience functions
export const withNetworkRetry = <T>(
  requestFn: () => Promise<T>,
  config?: Partial<NetworkErrorHandlerConfig>
): Promise<T> => {
  return networkErrorHandler.execute(requestFn, config)
}

export const createRetryableFetch = (config?: Partial<NetworkErrorHandlerConfig>) => {
  const handler = new NetworkErrorHandler(config)
  return handler.createFetchWrapper()
}

// Network status utilities
export class NetworkStatusMonitor {
  private isOnline = navigator.onLine
  private listeners: Array<(isOnline: boolean) => void> = []

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    }
  }

  private handleOnline = () => {
    this.isOnline = true
    this.notifyListeners()
  }

  private handleOffline = () => {
    this.isOnline = false
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline))
  }

  getStatus(): boolean {
    return this.isOnline
  }

  subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }
    this.listeners = []
  }
}

export const networkStatusMonitor = new NetworkStatusMonitor()