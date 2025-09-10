import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'
import { createMockClient } from './mock-client'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check if we should use mock client (for development/testing)
  const useMockClient = process.env.NODE_ENV === 'development' && (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('invalid'))

  if (useMockClient) {
    console.log('🔧 Using mock Supabase client for development')
    return createMockClient() as any
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Missing Supabase environment variables, falling back to mock client')
    return createMockClient() as any
  }

  try {
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn('⚠️ Failed to create Supabase client, falling back to mock client:', error)
    return createMockClient() as any
  }
}