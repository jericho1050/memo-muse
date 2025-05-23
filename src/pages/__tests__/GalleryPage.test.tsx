import { renderWithProviders, screen, userEvent } from '../../test/utils'
import GalleryPage from '../GalleryPage'
import type { Media, Collection } from '../../lib/supabase'

const mockMedia: Media[] = [
  {
    id: '1',
    user_id: 'u1',
    file_name: 'photo1.jpg',
    file_path: 'media/photo1.jpg',
    file_type: 'image/jpeg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    taken_at: '2024-01-01T00:00:00Z',
    location: 'Loc',
    thumbnail_url: 'thumb/photo1.jpg',
  },
  {
    id: '2',
    user_id: 'u1',
    file_name: 'photo2.jpg',
    file_path: 'media/photo2.jpg',
    file_type: 'image/jpeg',
    created_at: '2023-12-31T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z',
    taken_at: '2023-12-31T00:00:00Z',
    location: 'Loc',
    thumbnail_url: 'thumb/photo2.jpg',
  },
]

const mockCollections: Collection[] = [
  {
    id: 'c1',
    user_id: 'u1',
    title: 'First',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 'c2',
    user_id: 'u1',
    title: 'Second',
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2023-12-01T00:00:00Z',
  },
]

const fetchMedia = vi.fn()
const fetchCollections = vi.fn(async () => mockCollections)
const fetchCollectionMedia = vi.fn(async () => mockMedia)

vi.mock('../../store/mediaStore', () => ({
  useMediaStore: () => ({
    media: mockMedia,
    loading: false,
    uploading: false,
    error: null,
    fetchMedia,
    uploadMedia: vi.fn(),
    deleteMedia: vi.fn(),
  }),
}))

vi.mock('../../store/collectionStore', () => ({
  useCollectionStore: () => ({
    fetchCollections,
    fetchCollectionMedia,
  }),
}))

describe('GalleryPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders media from the store', async () => {
    renderWithProviders(<GalleryPage />)
    expect(await screen.findByText('photo1.jpg')).toBeInTheDocument()
  })

  it('filters to collections view', async () => {
    renderWithProviders(<GalleryPage />)
    await userEvent.click(screen.getByRole('button', { name: /collections/i }))
    expect(await screen.findByText('Your Collections')).toBeInTheDocument()
    expect(fetchCollections).toHaveBeenCalled()
  })

  it('sorts media by date in timeline view', async () => {
    renderWithProviders(<GalleryPage />)
    await userEvent.click(screen.getByRole('button', { name: /timeline/i }))
    const headings = await screen.findAllByRole('heading', { level: 3 })
    expect(headings[0].textContent).toMatch(/January 1, 2024/)
  })

  it('limits collection thumbnails to four images', async () => {
    renderWithProviders(<GalleryPage />)
    await userEvent.click(screen.getByRole('button', { name: /collections/i }))
    const imgs = await screen.findAllByRole('img')
    // two collections mocked with two images each
    expect(imgs.length).toBe(4)
  })
})
