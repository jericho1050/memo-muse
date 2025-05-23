import { fireEvent, render, screen } from '@testing-library/react'
import HomePage from '../pages/HomePage'
import { useAuth } from '../utils/auth'
import { useNavigate } from 'react-router-dom'

jest.mock('../utils/auth')
jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useNavigate: jest.fn(),
}))

describe('HomePage user flow', () => {
	test('unauthenticated click on Get Started navigates to register', () => {
		;(useAuth as jest.Mock).mockReturnValue({
			isAuthenticated: false,
			isLoading: false,
		})
		const navigate = jest.fn()
		;(useNavigate as jest.Mock).mockReturnValue(navigate)

		render(<HomePage />)
		const button = screen.getByText('Get Started')
		fireEvent.click(button)
		expect(navigate).toHaveBeenCalledWith('/register')
	})
})
