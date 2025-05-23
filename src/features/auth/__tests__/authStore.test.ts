import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../../../store/authStore'
import { supabase } from '../../../lib/supabase'

vi.mock('../../../lib/supabase', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/supabase')>('../../../lib/supabase')
  return {
    ...actual,
    supabase: {
      auth: {
        getSession: vi.fn(),
        getUser: vi.fn(),
        onAuthStateChange: vi.fn(),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      },
    },
  }
})

function resetStore() {
  useAuthStore.setState(state => ({
    ...state,
    user: null,
    session: null,
    loading: true,
    initialized: false,
  }))
}

beforeEach(() => {
  resetStore()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('Auth store', () => {
  it('initial state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.session).toBeNull()
    expect(state.loading).toBe(true)
    expect(state.initialized).toBe(false)
  })
})

  it('sign in flow', async () => {
    let callback: ((event: string, session: any) => void) | undefined
    ;(supabase.auth.onAuthStateChange as any).mockImplementation(cb => {
      callback = cb
    })
    ;(supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } })
    ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } })
    await useAuthStore.getState().initialize()
    const promise = useAuthStore.getState().signIn('a@b.com', 'pw')
    expect(useAuthStore.getState().loading).toBe(true)
    await promise
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' })
    expect(useAuthStore.getState().loading).toBe(false)
    callback?.('SIGNED_IN', { user: { id: '1', email: 'a@b.com' } })
    expect(useAuthStore.getState().user).toEqual({ id: '1', email: 'a@b.com' })
  })

  it('sign up flow', async () => {
    ;(supabase.auth.signUp as any).mockResolvedValue({ data: {}, error: null })
    const promise = useAuthStore.getState().signUp('b@c.com', 'pw')
    expect(useAuthStore.getState().loading).toBe(true)
    await promise
    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'b@c.com', password: 'pw' })
    expect(useAuthStore.getState().loading).toBe(false)
  })

  it('sign out flow', async () => {
    useAuthStore.setState(state => ({ ...state, user: { id: '1', email: 'a@b.com' }, session: {} }))
    ;(supabase.auth.signOut as any).mockResolvedValue({})
    await useAuthStore.getState().signOut()
    expect(supabase.auth.signOut).toHaveBeenCalled()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().session).toBeNull()
    expect(useAuthStore.getState().loading).toBe(false)
  })

  it('session management', async () => {
    let callback: ((event: string, session: any) => void) | undefined
    ;(supabase.auth.onAuthStateChange as any).mockImplementation(cb => {
      callback = cb
    })
    ;(supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: { id: '1', email: 'a@b.com' } } } })
    ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: '1', email: 'a@b.com' } } })
    await useAuthStore.getState().initialize()
    expect(useAuthStore.getState().user).toEqual({ id: '1', email: 'a@b.com' })
    expect(useAuthStore.getState().session).toEqual({ user: { id: '1', email: 'a@b.com' } })
    expect(useAuthStore.getState().initialized).toBe(true)
    callback?.('SIGNED_OUT', null)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('error handling', async () => {
    ;(supabase.auth.signInWithPassword as any).mockResolvedValue({ error: new Error('invalid') })
    await expect(useAuthStore.getState().signIn('x@y.com', 'pw')).rejects.toThrow('invalid')
    expect(useAuthStore.getState().loading).toBe(false)

    ;(supabase.auth.signUp as any).mockResolvedValue({ error: new Error('bad') })
    await expect(useAuthStore.getState().signUp('x@y.com', 'pw')).rejects.toThrow('bad')
    expect(useAuthStore.getState().loading).toBe(false)

    useAuthStore.setState(state => ({ ...state, user: { id: '1' }, session: {} }))
    ;(supabase.auth.signOut as any).mockRejectedValue(new Error('oops'))
    await useAuthStore.getState().signOut()
    expect(useAuthStore.getState().user).toEqual({ id: '1' })
    expect(useAuthStore.getState().loading).toBe(false)

    ;(supabase.auth.getSession as any).mockRejectedValue(new Error('init fail'))
    await useAuthStore.getState().initialize()
    expect(useAuthStore.getState().initialized).toBe(true)
    expect(useAuthStore.getState().loading).toBe(false)
  })
})
