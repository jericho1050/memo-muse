import { describe, it, expect, beforeEach, vi } from 'vitest'

let authChangeCallback: (event: string, session: any) => void

const signInWithPassword = vi.fn()
const signUp = vi.fn()
const signOut = vi.fn()
const getSession = vi.fn()
const getUser = vi.fn()
const onAuthStateChange = vi.fn(cb => {
  authChangeCallback = cb
})

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword,
      signUp,
      signOut,
      getSession,
      getUser,
      onAuthStateChange,
    },
  },
}))

import { useAuthStore } from '../../../store/authStore'

const initialState = useAuthStore.getState()

beforeEach(() => {
  useAuthStore.setState(initialState)
  vi.clearAllMocks()
})

describe('auth store', () => {
  it('initial state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBe(null)
    expect(state.session).toBe(null)
    expect(state.loading).toBe(true)
    expect(state.initialized).toBe(false)
  })

  it('sign in flow', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    await useAuthStore.getState().initialize()

    signInWithPassword.mockResolvedValue({ error: null })
    const promise = useAuthStore.getState().signIn('a@b.com', 'pass')
    expect(useAuthStore.getState().loading).toBe(true)
    await promise
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pass' })
    expect(useAuthStore.getState().loading).toBe(false)

    const session = { user: { id: '1', email: 'a@b.com' } }
    authChangeCallback('SIGNED_IN', session)
    expect(useAuthStore.getState().user).toEqual(session.user)
    expect(useAuthStore.getState().session).toEqual(session)
  })

  it('sign up flow', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    await useAuthStore.getState().initialize()

    signUp.mockResolvedValue({ error: null })
    const promise = useAuthStore.getState().signUp('b@c.com', 'pass')
    expect(useAuthStore.getState().loading).toBe(true)
    await promise
    expect(signUp).toHaveBeenCalledWith({ email: 'b@c.com', password: 'pass' })
    expect(useAuthStore.getState().loading).toBe(false)

    const session = { user: { id: '2', email: 'b@c.com' } }
    authChangeCallback('SIGNED_IN', session)
    expect(useAuthStore.getState().user).toEqual(session.user)
  })

  it('sign out flow', async () => {
    useAuthStore.setState({
      ...initialState,
      user: { id: '1', email: 'a@b.com' },
      session: { user: { id: '1', email: 'a@b.com' } },
      loading: false,
    })

    signOut.mockResolvedValue({})
    const promise = useAuthStore.getState().signOut()
    expect(useAuthStore.getState().loading).toBe(true)
    await promise
    expect(signOut).toHaveBeenCalled()
    expect(useAuthStore.getState().user).toBe(null)
    expect(useAuthStore.getState().session).toBe(null)
    expect(useAuthStore.getState().loading).toBe(false)
  })

  it('session management', async () => {
    const session = { user: { id: '1', email: 'a@b.com' } }
    getSession.mockResolvedValue({ data: { session } })
    getUser.mockResolvedValue({ data: { user: session.user } })

    await useAuthStore.getState().initialize()
    expect(useAuthStore.getState().user).toEqual(session.user)
    expect(useAuthStore.getState().session).toEqual(session)
    expect(useAuthStore.getState().initialized).toBe(true)

    authChangeCallback('SIGNED_OUT', null)
    expect(useAuthStore.getState().user).toBe(null)
    expect(useAuthStore.getState().session).toBe(null)
  })

  it('error handling', async () => {
    signInWithPassword.mockResolvedValue({ error: new Error('bad') })
    await expect(useAuthStore.getState().signIn('x@y.com', 'bad')).rejects.toThrow('bad')
    expect(useAuthStore.getState().loading).toBe(false)

    signUp.mockResolvedValue({ error: new Error('fail') })
    await expect(useAuthStore.getState().signUp('x@y.com', 'bad')).rejects.toThrow('fail')
    expect(useAuthStore.getState().loading).toBe(false)
  })
})
