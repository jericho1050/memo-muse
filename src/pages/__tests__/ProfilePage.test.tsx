import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, userEvent, render, waitFor } from '../../test/utils'
import { act } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import ProfilePage from '../ProfilePage'
import { AuthProvider, RequireAuth } from '../../utils/auth'

vi.mock('../../store/authStore', () => {
  const mockState = {
    user: { id: '1', email: 'me@test.com' },
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
  mockState.loading = false
  mockState.user = { id: '1', email: 'me@test.com' }
  vi.spyOn(window, 'alert').mockImplementation(() => {})
})

describe('ProfilePage', () => {
  it('renders page', () => {
    const router = createMemoryRouter(
      [{ path: '/profile', element: <ProfilePage /> }],
      { initialEntries: ['/profile'] },
    )
    renderWithRouter(router)
    expect(
      screen.getByRole('heading', { name: /your profile/i }),
    ).toBeInTheDocument()
  })

  it('signs out and navigates', async () => {
    const router = createMemoryRouter(
      [
        { path: '/profile', element: <ProfilePage /> },
        { path: '/login', element: <div>Login</div> },
      ],
      { initialEntries: ['/profile'] },
    )
    renderWithRouter(router)

    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))

    expect(mockState.signOut).toHaveBeenCalled()
    expect(router.state.location.pathname).toBe('/login')
  })


  it('redirects unauthenticated users', () => {
    mockState.user = null
    const router = createMemoryRouter(
      [
        {
          path: '/profile',
          element: (
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          ),
        },
        { path: '/login', element: <div>Login</div> },
      ],
      { initialEntries: ['/profile'] },
    )
    renderWithRouter(router)
    expect(router.state.location.pathname).toBe('/login')
  })
})
