export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AllProviders } from './mocks/providers'

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}
