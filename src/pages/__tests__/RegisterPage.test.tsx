import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, userEvent, render } from '../../test/utils'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import RegisterPage from '../RegisterPage'
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

describe('RegisterPage', () => {
  it('renders page', () => {
    const router = createMemoryRouter(
      [{ path: '/register', element: <RegisterPage /> }],
      { initialEntries: ['/register'] },
    )
    renderWithRouter(router)
    expect(
      screen.getByRole('heading', { name: /create account/i }),
    ).toBeInTheDocument()
  })

  it('submits form and navigates', async () => {
    mockState.signUp.mockResolvedValue(undefined)
    const router = createMemoryRouter(
      [
        { path: '/register', element: <RegisterPage /> },
        { path: '/gallery', element: <div>Gallery</div> },
      ],
      { initialEntries: ['/register'] },
    )
    renderWithRouter(router)

    await userEvent.type(
      screen.getByLabelText(/^email$/i),
      'new@example.com',
    )
    await userEvent.type(
      screen.getByLabelText(/^password$/i),
      'password',
    )
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      'password',
    )
    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    )

    expect(mockState.signUp).toHaveBeenCalledWith(
      'new@example.com',
      'password',
    )
    expect(router.state.location.pathname).toBe('/gallery')
  })

  it('shows validation error for mismatch', async () => {
    const router = createMemoryRouter(
      [{ path: '/register', element: <RegisterPage /> }],
      { initialEntries: ['/register'] },
    )
    renderWithRouter(router)

    await userEvent.type(
      screen.getByLabelText(/^email$/i),
      'a@b.com',
    )
    await userEvent.type(
      screen.getByLabelText(/^password$/i),
      'pass1',
    )
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      'pass2',
    )
    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    )

    expect(
      screen.getByText(/passwords do not match/i),
    ).toBeInTheDocument()
  })

  it('shows error when sign up fails', async () => {
    mockState.signUp.mockRejectedValue(new Error('oops'))
    const router = createMemoryRouter(
      [{ path: '/register', element: <RegisterPage /> }],
      { initialEntries: ['/register'] },
    )
    renderWithRouter(router)

    await userEvent.type(
      screen.getByLabelText(/^email$/i),
      'test@test.com',
    )
    await userEvent.type(
      screen.getByLabelText(/^password$/i),
      'password',
    )
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      'password',
    )
    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    )

    expect(
      await screen.findByText(/oops/i),
    ).toBeInTheDocument()
  })

  it('navigates to login page', async () => {
    const router = createMemoryRouter(
      [
        { path: '/register', element: <RegisterPage /> },
        { path: '/login', element: <div>Login</div> },
      ],
      { initialEntries: ['/register'] },
    )
    renderWithRouter(router)

    await userEvent.click(
      screen.getByRole('link', { name: /sign in/i }),
    )

    expect(router.state.location.pathname).toBe('/login')
  })
})
