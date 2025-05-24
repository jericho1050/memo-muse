import { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
// Simplified provider for tests to avoid Supabase dependency

interface ProvidersProps {
  children: ReactNode
}

export function AllProviders({ children }: ProvidersProps) {
	return <MemoryRouter>{children}</MemoryRouter>
}
