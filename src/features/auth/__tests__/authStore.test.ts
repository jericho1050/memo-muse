import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../../../store/authStore'

// Mock supabase module
var mockSupabase: any
vi.mock('../../../lib/supabase', () => {
  mockSupabase = {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  }

  return { supabase: mockSupabase }
})

interface SessionUser {
  id: string
  email: string
}

interface Session {
  user: SessionUser
}

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  })
  vi.clearAllMocks()
})

describe('auth store', () => {
  it('initial state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.session).toBeNull()
    expect(state.loading).toBe(true)
    expect(state.initialized).toBe(false)
  })

  it('sign in flow', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null })

    const promise = useAuthStore.getState().signIn('a@test.com', 'pass')
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@test.com',
      password: 'pass',
    })
    expect(useAuthStore.getState().loading).toBe(true)
    await expect(promise).resolves.toBeUndefined()
    expect(useAuthStore.getState().loading).toBe(false)
  })

  it('sign up flow', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ error: null })

    const promise = useAuthStore.getState().signUp('b@test.com', 'pass')
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({ email: 'b@test.com', password: 'pass' })
    expect(useAuthStore.getState().loading).toBe(true)
    await expect(promise).resolves.toBeUndefined()
    expect(useAuthStore.getState().loading).toBe(false)
  })

  it('sign out flow', async () => {
    mockSupabase.auth.signOut.mockResolvedValue(undefined)
    useAuthStore.setState({ user: { id: '1', email: 'a@test.com' }, session: { user: { id: '1', email: 'a@test.com' } } as unknown as Session, loading: false, initialized: true })

    const promise = useAuthStore.getState().signOut()
    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    expect(useAuthStore.getState().loading).toBe(true)
    await promise
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.session).toBeNull()
    expect(state.loading).toBe(false)
  })

  it('session management', async () => {
    const session: Session = { user: { id: '1', email: 'test@test.com' } }
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session } })
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: session.user } })
    let listener: ((event: string, session: Session | null) => void) | undefined
    mockSupabase.auth.onAuthStateChange.mockImplementation((cb) => {
      listener = cb
    })

    await useAuthStore.getState().initialize()
    const state = useAuthStore.getState()
    expect(mockSupabase.auth.getSession).toHaveBeenCalled()
    expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
    expect(state.user).toEqual(session.user)
    expect(state.session).toEqual(session)
    expect(state.loading).toBe(false)
    expect(state.initialized).toBe(true)

    // trigger auth state change
    const newSession: Session = { user: { id: '2', email: 'update@test.com' } }
    listener?.('SIGNED_IN', newSession)
    const updated = useAuthStore.getState()
    expect(updated.user).toEqual(newSession.user)
    expect(updated.session).toEqual(newSession)
  })

  it('error handling', async () => {
    const err = new Error('fail')
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: err })
    await expect(useAuthStore.getState().signIn('x@test.com', '123')).rejects.toBe(err)
    expect(useAuthStore.getState().loading).toBe(false)

    mockSupabase.auth.signUp.mockResolvedValue({ error: err })
    await expect(useAuthStore.getState().signUp('x@test.com', '123')).rejects.toBe(err)
    expect(useAuthStore.getState().loading).toBe(false)
  })
})
