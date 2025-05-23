import { loginAction } from '../pages/LoginPage'
import { useAuthStore } from '../store/authStore'

jest.mock('../store/authStore', () => ({
	useAuthStore: {
		getState: () => ({ signIn: jest.fn() }),
	},
}))

describe('loginAction', () => {
	test('returns error if fields missing', async () => {
		const request = new Request('http://test', { method: 'POST' })
		const result = await loginAction({ request } as any)
		expect(result).toEqual({ error: 'Please enter both email and password' })
	})
})
