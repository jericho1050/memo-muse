import { screen } from '../../test/utils'
import { renderWithProviders, userEvent } from '../../test/utils'
import ImageCollageCreator from '../ImageCollageCreator'
import { vi } from 'vitest'

type MediaItem = { id: string; supabaseUrl: string }


vi.mock('../../store/mediaStore', () => {
const images: MediaItem[] = [
{ id: '1', supabaseUrl: 'img1.jpg', file_type: 'image/png' } as any,
{ id: '2', supabaseUrl: 'img2.jpg', file_type: 'image/png' } as any,
]
return {
useMediaStore: () => ({
media: images,
fetchMedia: vi.fn(),
loading: false,
})
}
})


describe('ImageCollageCreator', () => {

test('toggles image selection on click', async () => {
renderWithProviders(<ImageCollageCreator />)
const first = screen.getAllByRole('img')[0]
await userEvent.click(first)
expect(screen.getByText('1 image(s) selected.')).toBeInTheDocument()
await userEvent.click(first)
expect(screen.getByText('0 image(s) selected.')).toBeInTheDocument()
})

test('disable generate button with no selection', () => {
renderWithProviders(<ImageCollageCreator />)
const button = screen.getByText('Generate Story') as HTMLButtonElement
expect(button.disabled).toBe(true)
})
})
