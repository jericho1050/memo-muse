import { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../utils/auth'

interface ProvidersProps {
  children: ReactNode
}

export function AllProviders({ children }: ProvidersProps) {
  return (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  )
}
