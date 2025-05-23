import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../utils/auth'

interface Props {
  children: ReactNode
}

/**
 * Wraps children with test providers.
 */
export default function MockProviders({ children }: Props) {
  return (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  )
}
