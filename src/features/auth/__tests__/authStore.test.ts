import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../../../store/authStore'

let onAuthChange: ((event: string, session: any) => void) | undefined

const supabaseMock = {
auth: {
getSession: vi.fn(),
getUser: vi.fn(),
onAuthStateChange: vi.fn((cb: typeof onAuthChange) => {
onAuthChange = cb
return { data: { subscription: { unsubscribe: vi.fn() } } }
}),
signInWithPassword: vi.fn(),
signUp: vi.fn(),
signOut: vi.fn(),
},
}

vi.mock('../../../lib/supabase', () => ({ supabase: supabaseMock }))

const resetStore = () =>
useAuthStore.setState({
user: null,
session: null,
loading: true,
initialized: false,
})

beforeEach(() => {
supabaseMock.auth.getSession.mockResolvedValue({ data: { session: null } })
supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } })
supabaseMock.auth.signInWithPassword.mockResolvedValue({ error: null })
supabaseMock.auth.signUp.mockResolvedValue({ error: null })
supabaseMock.auth.signOut.mockResolvedValue({ error: null })
onAuthChange = undefined
resetStore()
})

afterEach(() => {
vi.clearAllMocks()
resetStore()
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
await useAuthStore.getState().initialize()
const promise = useAuthStore.getState().signIn('a@test.com', 'pw')
expect(useAuthStore.getState().loading).toBe(true)
await promise
expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledWith({
email: 'a@test.com',
password: 'pw',
})
expect(useAuthStore.getState().loading).toBe(false)
onAuthChange?.('SIGNED_IN', {
user: { id: '1', email: 'a@test.com' },
})
expect(useAuthStore.getState().user).toEqual({
id: '1',
email: 'a@test.com',
})
expect(useAuthStore.getState().session).toEqual({
user: { id: '1', email: 'a@test.com' },
})
})

it('sign up flow', async () => {
await useAuthStore.getState().initialize()
const promise = useAuthStore.getState().signUp('b@test.com', 'pw')
expect(useAuthStore.getState().loading).toBe(true)
await promise
expect(supabaseMock.auth.signUp).toHaveBeenCalledWith({
email: 'b@test.com',
password: 'pw',
})
expect(useAuthStore.getState().loading).toBe(false)
onAuthChange?.('SIGNED_IN', {
user: { id: '2', email: 'b@test.com' },
})
expect(useAuthStore.getState().user).toEqual({
id: '2',
email: 'b@test.com',
})
})

it('sign out flow', async () => {
useAuthStore.setState({
user: { id: '3', email: 'c@test.com' },
session: { user: { id: '3', email: 'c@test.com' } },
loading: false,
initialized: true,
})
const promise = useAuthStore.getState().signOut()
expect(useAuthStore.getState().loading).toBe(true)
await promise
expect(supabaseMock.auth.signOut).toHaveBeenCalled()
expect(useAuthStore.getState().user).toBeNull()
expect(useAuthStore.getState().session).toBeNull()
expect(useAuthStore.getState().loading).toBe(false)
})

it('session management', async () => {
const session = { user: { id: '4', email: 'd@test.com' } }
supabaseMock.auth.getSession.mockResolvedValue({ data: { session } })
supabaseMock.auth.getUser.mockResolvedValue({ data: { user: session.user } })
await useAuthStore.getState().initialize()
expect(useAuthStore.getState().user).toEqual(session.user)
expect(useAuthStore.getState().session).toEqual(session)
expect(useAuthStore.getState().initialized).toBe(true)
expect(useAuthStore.getState().loading).toBe(false)
})

it('error handling', async () => {
const error = new Error('fail')
supabaseMock.auth.signInWithPassword.mockResolvedValue({ error })
await expect(
useAuthStore.getState().signIn('e@test.com', 'pw'),
).rejects.toThrow('fail')
expect(useAuthStore.getState().loading).toBe(false)
})
})

