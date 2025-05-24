import { describe, it, expect, vi } from 'vitest'
import RegisterPage from '../../pages/RegisterPage'
import { renderWithProviders, screen, waitFor, userEvent, fireEvent } from '../../test/utils'

const mockSignUp = vi.fn()
const mockState = {
user: null,
session: null,
loading: false,
signIn: vi.fn(),
signUp: mockSignUp,
signOut: vi.fn(),
initialize: vi.fn(),
}

vi.mock('../../store/authStore', () => {
const useAuthStore = vi.fn(() => mockState)
useAuthStore.getState = () => mockState
return { useAuthStore }
})

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
const actual = await vi.importActual<typeof import('react-router-dom')>(
'react-router-dom'
)
return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../utils/auth', async () => {
const actual = await vi.importActual('../../utils/auth')
return { ...actual, AuthProvider: ({ children }: any) => <>{children}</> }
})

describe('RegisterForm', () => {
it('shows validation errors', async () => {
  renderWithProviders(<RegisterPage />)
  const form = document.querySelector('form') as HTMLFormElement
  fireEvent.submit(form)
  expect(
    await screen.findByText(/please enter both email and password/i)
  ).toBeInTheDocument()
})

it('shows password mismatch error', async () => {
  renderWithProviders(<RegisterPage />)
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
  await userEvent.type(screen.getByLabelText(/^password$/i), '123456')
  await userEvent.type(screen.getByLabelText(/confirm password/i), '654321')
  await userEvent.click(screen.getByRole('button', { name: /create account/i }))
  expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
})

it('submits valid data', async () => {
  mockSignUp.mockResolvedValueOnce(undefined)
  renderWithProviders(<RegisterPage />)
  await userEvent.type(screen.getByLabelText(/email/i), 'user@t.com')
  await userEvent.type(screen.getByLabelText(/^password$/i), '123456')
  await userEvent.type(screen.getByLabelText(/confirm password/i), '123456')
  await userEvent.click(screen.getByRole('button', { name: /create account/i }))
  await waitFor(() => expect(mockSignUp).toHaveBeenCalledWith('user@t.com', '123456'))
})

it('shows error from sign up', async () => {
  mockSignUp.mockRejectedValueOnce(new Error('Failed'))
  renderWithProviders(<RegisterPage />)
  await userEvent.type(screen.getByLabelText(/email/i), 'user@t.com')
  await userEvent.type(screen.getByLabelText(/^password$/i), '123456')
  await userEvent.type(screen.getByLabelText(/confirm password/i), '123456')
  await userEvent.click(screen.getByRole('button', { name: /create account/i }))
  await waitFor(() => expect(screen.getByText(/failed/i)).toBeInTheDocument())
})

it('shows loading state', () => {
  mockState.loading = true
  renderWithProviders(<RegisterPage />)
  const button = screen.getByRole('button', { name: /creating account/i })
  expect(button).toBeDisabled()
  mockState.loading = false
})

it('navigates on success', async () => {
  mockSignUp.mockResolvedValueOnce(undefined)
  renderWithProviders(<RegisterPage />)
  await userEvent.type(screen.getByLabelText(/email/i), 'user@t.com')
  await userEvent.type(screen.getByLabelText(/^password$/i), '123456')
  await userEvent.type(screen.getByLabelText(/confirm password/i), '123456')
  await userEvent.click(screen.getByRole('button', { name: /create account/i }))
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/gallery'))
})
})
