import { vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Layout from '../Layout'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth } from '../../utils/auth'

vi.mock('../../utils/auth', () => ({
useAuth: vi.fn(),
}))
vi.mock('../../store/authStore', () => ({
useAuthStore: () => ({ signOut: vi.fn() }),
}))

const mockUseAuth = useAuth as unknown as { mockReturnValue: (v: unknown) => void }

function renderLayout() {
        return render(
                <MemoryRouter initialEntries={['/']}>
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<div>Home Page</div>} />
					<Route path='gallery' element={<div>Gallery Page</div>} />
					<Route path='login' element={<div>Login Page</div>} />
				</Route>
			</Routes>
                </MemoryRouter>,
        )
}

describe('Layout component', () => {
	it('renders with auth', () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false })
		renderLayout()

		expect(screen.getByText('MomentCollage')).toBeInTheDocument()
		expect(screen.getByText('Gallery')).toBeInTheDocument()
		expect(screen.queryByText('Login')).not.toBeInTheDocument()
	})

	it('renders without auth', () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false })
		renderLayout()

		expect(screen.getByText('Login')).toBeInTheDocument()
		expect(screen.getByText('Sign Up')).toBeInTheDocument()
	})

	it('shows loading state', () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true })
		renderLayout()

		expect(screen.getByText('Loading MomentCollage...')).toBeInTheDocument()
	})

	it('navigates between pages', async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false })
		renderLayout()

await userEvent.click(screen.getByText('Gallery'))

expect(screen.getByText('Gallery Page')).toBeInTheDocument()
})

it('toggles mobile menu', async () => {
mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false })
renderLayout()

const initial = screen.getAllByText('Profile').length
const toggle = screen.getByLabelText('Toggle menu')
await userEvent.click(toggle)

expect(screen.getAllByText('Profile').length).toBeGreaterThan(initial)

await userEvent.click(toggle)

expect(screen.getAllByText('Profile').length).toBe(initial)
})
})
