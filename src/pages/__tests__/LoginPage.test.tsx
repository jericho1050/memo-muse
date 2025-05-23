import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, userEvent, render } from '../../test/utils'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import LoginPage, { loginAction } from '../LoginPage'
import { AuthProvider } from '../../utils/auth'

vi.mock('../../store/authStore', () => {
  const mockState = {
    user: null,
    loading: false,
    initialized: true,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    initialize: vi.fn(),
  }
  const useAuthStore = vi.fn(() => mockState)
  useAuthStore.getState = () => mockState
  return { __esModule: true, useAuthStore, mockState }
})

import { mockState } from '../../store/authStore'

function renderWithRouter(router: ReturnType<typeof createMemoryRouter>) {
  return render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockState.user = null
  mockState.loading = false
})

describe('LoginPage', () => {
  it('renders page', () => {
    const router = createMemoryRouter(
      [{ path: '/login', element: <LoginPage />, action: loginAction }],
      { initialEntries: ['/login'] },
    )
    renderWithRouter(router)
    expect(
      screen.getByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument()
  })

  it('loginAction succeeds', async () => {
    mockState.signIn.mockResolvedValue(undefined)
    const formData = new FormData()
    formData.append('email', 'test@example.com')
    formData.append('password', 'password')
    const request = { formData: async () => formData } as Request

    const result = await loginAction({ request } as any)

    expect(mockState.signIn).toHaveBeenCalledWith(
      'test@example.com',
      'password',
    )
    expect(result).toEqual({ success: true })
  })

  it('loginAction returns error', async () => {
    mockState.signIn.mockRejectedValue(new Error('fail'))
    const formData = new FormData()
    formData.append('email', 'a@b.com')
    formData.append('password', 'bad')
    const request = { formData: async () => formData } as Request

    const result = await loginAction({ request } as any)

    expect(mockState.signIn).toHaveBeenCalled()
    expect(result).toEqual({ error: 'fail' })
  })

  it('navigates to register page', async () => {
    const router = createMemoryRouter(
      [
        { path: '/login', element: <LoginPage />, action: loginAction },
        { path: '/register', element: <div>Register</div> },
      ],
      { initialEntries: ['/login'] },
    )
    renderWithRouter(router)

    await userEvent.click(
      screen.getByRole('link', { name: /sign up/i }),
    )

    expect(router.state.location.pathname).toBe('/register')
  })
})
