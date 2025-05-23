import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

process.env.VITE_SUPABASE_URL = 'http://localhost'
process.env.VITE_SUPABASE_ANON_KEY = 'anon'

// Mock Supabase client to avoid environment requirements
vi.mock('../lib/supabase', async () => {
  const actual = await vi.importActual('../lib/supabase') as any
  return {
    ...actual,
    supabase: {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null } })),
        getSession: vi.fn(async () => ({ data: { session: null } })),
        onAuthStateChange: vi.fn(),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      },
      from: vi.fn((table: string) => {
        const api = {
          select: vi.fn(() => api),
          eq: vi.fn(() => api),
          order: vi.fn(() => api),
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
          delete: vi.fn(() => Promise.resolve({ error: null })),
          update: vi.fn(() => Promise.resolve({ error: null })),
        }
        return api
      }),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(),
          remove: vi.fn(),
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: '' } })),
        })),
      },
    },
  }
})

// Simple mock server to satisfy tests without msw
const server = {
  listen: () => {},
  resetHandlers: () => {},
  close: () => {},
}

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  cleanup()
})
afterAll(() => server.close())
