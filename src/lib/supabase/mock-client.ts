// Mock Supabase client for development and testing
import { User, Session, AuthError } from '@supabase/supabase-js'

// Mock user storage
const mockUsers = new Map<string, { email: string; password: string; id: string }>()
let currentSession: Session | null = null

// Generate mock user ID
const generateUserId = () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Create mock user object
const createMockUser = (email: string, id: string): User => ({
  id,
  email,
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

// Create mock session
const createMockSession = (user: User): Session => ({
  access_token: `mock_token_${Date.now()}`,
  refresh_token: `mock_refresh_${Date.now()}`,
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user,
})

export const createMockClient = () => {
  return {
    auth: {
      async getSession() {
        return { data: { session: currentSession }, error: null }
      },

      async signUp({ email, password }: { email: string; password: string }) {
        try {
          // Check if user already exists
          if (mockUsers.has(email)) {
            const error = {
              name: 'AuthError',
              message: 'User already registered',
              status: 400,
            } as AuthError
            return { data: null, error }
          }

          // Create new user
          const userId = generateUserId()
          mockUsers.set(email, { email, password, id: userId })
          
          const user = createMockUser(email, userId)
          const session = createMockSession(user)
          currentSession = session

          console.log(`✅ Mock user registered: ${email}`)
          
          return { 
            data: { user, session }, 
            error: null 
          }
        } catch (error) {
          return { 
            data: null, 
            error: error as AuthError 
          }
        }
      },

      async signInWithPassword({ email, password }: { email: string; password: string }) {
        try {
          const storedUser = mockUsers.get(email)
          
          if (!storedUser || storedUser.password !== password) {
            const error = {
              name: 'AuthError',
              message: 'Invalid login credentials',
              status: 400,
            } as AuthError
            return { data: null, error }
          }

          const user = createMockUser(email, storedUser.id)
          const session = createMockSession(user)
          currentSession = session

          console.log(`✅ Mock user signed in: ${email}`)
          
          return { 
            data: { user, session }, 
            error: null 
          }
        } catch (error) {
          return { 
            data: null, 
            error: error as AuthError 
          }
        }
      },

      async signOut() {
        currentSession = null
        console.log('✅ Mock user signed out')
        return { error: null }
      },

      async resetPasswordForEmail(email: string, options?: any) {
        console.log(`✅ Mock password reset requested for: ${email}`)
        return { error: null }
      },

      onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        // Simulate auth state change listener
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                console.log('✅ Mock auth listener unsubscribed')
              }
            }
          }
        }
      }
    },

    from(table: string) {
      return {
        select: (columns = '*') => ({
          eq: (column: string, value: any) => ({
            order: (column: string, options?: any) => ({
              then: (resolve: any) => {
                // Mock empty data for now
                return Promise.resolve({ data: [], error: null }).then(resolve)
              }
            }),
            then: (resolve: any) => {
              // Mock empty data for now
              return Promise.resolve({ data: [], error: null }).then(resolve)
            }
          }),
          then: (resolve: any) => {
            // Mock empty data for now
            return Promise.resolve({ data: [], error: null }).then(resolve)
          }
        }),
        insert: (data: any) => ({
          select: (columns = '*') => ({
            single: () => ({
              then: (resolve: any) => {
                // Mock successful insert
                const mockData = { id: generateUserId(), ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                return Promise.resolve({ data: mockData, error: null }).then(resolve)
              }
            }),
            then: (resolve: any) => {
              // Mock successful insert
              const mockData = { id: generateUserId(), ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
              return Promise.resolve({ data: mockData, error: null }).then(resolve)
            }
          }),
          then: (resolve: any) => {
            // Mock successful insert
            const mockData = { id: generateUserId(), ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
            return Promise.resolve({ data: mockData, error: null }).then(resolve)
          }
        }),
        update: (data: any) => ({
          eq: (column: string, value: any) => ({
            select: (columns = '*') => ({
              single: () => ({
                then: (resolve: any) => {
                  // Mock successful update
                  const mockData = { id: value, ...data, updated_at: new Date().toISOString() }
                  return Promise.resolve({ data: mockData, error: null }).then(resolve)
                }
              }),
              then: (resolve: any) => {
                // Mock successful update
                const mockData = { id: value, ...data, updated_at: new Date().toISOString() }
                return Promise.resolve({ data: mockData, error: null }).then(resolve)
              }
            }),
            then: (resolve: any) => {
              // Mock successful update
              const mockData = { id: value, ...data, updated_at: new Date().toISOString() }
              return Promise.resolve({ data: mockData, error: null }).then(resolve)
            }
          })
        }),
        delete: () => ({
          eq: (column: string, value: any) => ({
            then: (resolve: any) => {
              // Mock successful delete
              return Promise.resolve({ error: null }).then(resolve)
            }
          })
        })
      }
    },

    channel: (name: string) => ({
      on: (event: string, config: any, callback: any) => ({
        subscribe: () => {
          console.log(`✅ Mock subscription created for ${name}`)
        }
      })
    })
  }
}