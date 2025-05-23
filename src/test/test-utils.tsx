import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import MockProviders from './MockProviders'

/**
 * Render a component wrapped with default test providers.
 */
export function renderWithProviders(ui: ReactElement, route = '/') {
  window.history.pushState({}, 'Test page', route)
  return render(ui, { wrapper: MockProviders })
}
