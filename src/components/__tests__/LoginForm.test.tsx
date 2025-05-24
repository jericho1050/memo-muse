import { describe, it, expect, vi } from 'vitest'
import { loginAction } from '../../pages/LoginPage'
import LoginPage from '../../pages/LoginPage'
import { renderWithProviders, screen } from '../../test/utils'

const mockSignIn = vi.fn()
const mockState = {
user: null,
session: null,
loading: false,
initialized: true,
signIn: mockSignIn,
signUp: vi.fn(),
signOut: vi.fn(),
initialize: vi.fn(),
}

vi.mock('../../store/authStore', () => {
const useAuthStore = vi.fn(() => mockState)
useAuthStore.getState = () => mockState
return { useAuthStore }
})

vi.mock('../../utils/auth', async () => {
  const actual = await vi.importActual('../../utils/auth')
  return { ...actual, AuthProvider: ({ children }: any) => <>{children}</> }
})

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useActionData: () => undefined, Form: (props: any) => <form {...props} /> }
})

describe('LoginForm', () => {
it('validates required fields', async () => {
  const request = new Request('http://localhost/login', {
    method: 'POST',
    body: new URLSearchParams().toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
const result = await loginAction({ request } as any)
expect(result).toEqual({
error: 'Please enter both email and password',
})
})

it('returns error state on sign-in failure', async () => {
mockSignIn.mockRejectedValueOnce({ status: 400, message: 'Invalid' })
  const request = new Request('http://localhost/login', {
    method: 'POST',
    body: new URLSearchParams({
      email: 'a@b.com',
      password: 'wrong',
    }).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
const result = await loginAction({ request } as any)
expect(result).toEqual({ error: 'Invalid' })
expect(mockSignIn).toHaveBeenCalledWith('a@b.com', 'wrong')
})

it('handles successful submission', async () => {
mockSignIn.mockResolvedValueOnce(undefined)
  const request = new Request('http://localhost/login', {
    method: 'POST',
    body: new URLSearchParams({
      email: 'ok@test.com',
      password: 'pass',
    }).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
const result = await loginAction({ request } as any)
expect(result).toEqual({ success: true })
expect(mockSignIn).toHaveBeenCalledWith('ok@test.com', 'pass')
})

it('shows loading state when signing in', () => {
mockState.loading = true
  renderWithProviders(<LoginPage />)
const button = screen.getByRole('button', { name: /signing in/i })
expect(button).toBeDisabled()
mockState.loading = false
})
})
