import { screen, fireEvent, waitFor } from '../../test/utils'
import { renderWithProviders } from '../../test/utils'
import CollageGrid from '../../features/collage/CollageGrid'
import type { Layouts } from 'react-grid-layout'
import { vi } from 'vitest'

vi.mock('react-grid-layout', () => {
const React = require('react')
function MockGrid({ children, onLayoutChange }: any) {
return (
<div data-testid="grid" onClick={() => onLayoutChange([], { lg: [{ i: '1', x: 1, y: 1, w: 3, h: 3 }] })}>
{children}
</div>
)
}
return { Responsive: MockGrid, WidthProvider: (C: any) => C }
})

beforeEach(() => {
localStorage.clear()
})

describe('CollageGrid', () => {
test('loads layout from localStorage', async () => {
const saved: Layouts = { lg: [{ i: '1', x: 2, y: 2, w: 3, h: 3 }] }
localStorage.setItem('collageLayout', JSON.stringify(saved))
const onLayoutChange = vi.fn()
renderWithProviders(
<CollageGrid images={[{ id: '1', url: 'a' }]} onLayoutChange={onLayoutChange} />,
)
await waitFor(() => expect(onLayoutChange).toHaveBeenCalled())
expect(onLayoutChange.mock.calls[0][0]).toEqual(saved)
})

test('updates layout on drag', async () => {
const onLayoutChange = vi.fn()
renderWithProviders(
<CollageGrid images={[{ id: '1', url: 'a' }]} onLayoutChange={onLayoutChange} />,
)
fireEvent.click(screen.getByTestId('grid'))
await waitFor(() =>
expect(JSON.parse(localStorage.getItem('collageLayout') || '{}')).toEqual({
lg: [{ i: '1', x: 1, y: 1, w: 3, h: 3 }],
}),
)
expect(onLayoutChange).toHaveBeenLastCalledWith({ lg: [{ i: '1', x: 1, y: 1, w: 3, h: 3 }] })
})

test('renders provided images', () => {
renderWithProviders(
<CollageGrid images={[{ id: '1', url: 'a' }, { id: '2', url: 'b' }]} />,
)
expect(screen.getAllByRole('presentation')).toHaveLength(2)
})
})
