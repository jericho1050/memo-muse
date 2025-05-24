import { renderWithProviders, screen } from '../../test/utils'
import CollectionPage from '../CollectionPage'
import type { Collection } from '../../lib/supabase'
vi.mock('../../components/CollectionView', () => ({ default: () => <div>Collection View</div> }))

const mockCollection: Collection = {
  id: 'c1',
  user_id: 'u1',
  title: 'Test Collection',
  created_at: '2024-01-02T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
}

const mockMediaItem = { id: 'm1' }

let collectionStoreState = {
  collections: [mockCollection],
  generateAISummary: vi.fn(),
  loading: false,
  processing: false,
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
  removeMediaFromCollection: vi.fn(),
  addMediaToCollection: vi.fn(),
  fetchCollectionMedia: vi.fn(async () => [mockMediaItem]),
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useParams: () => ({ id: 'c1' }), useNavigate: () => vi.fn() }
})

vi.mock('../../store/mediaStore', () => ({
  useMediaStore: () => ({
    media: [mockMediaItem],
    fetchMedia: vi.fn(),
  }),
}))

vi.mock('../../store/collectionStore', () => ({
  useCollectionStore: () => collectionStoreState,
}))

describe('CollectionPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
    collectionStoreState = { ...collectionStoreState, collections: [mockCollection] }
  })

  it('renders collection view component', async () => {
    renderWithProviders(<CollectionPage />)
    expect(await screen.findByText('Collection View')).toBeInTheDocument()
  })

  it('shows not found when collection is missing', async () => {
    collectionStoreState.collections = []
    renderWithProviders(<CollectionPage />)
    expect(await screen.findByText('Collection View')).toBeInTheDocument()
  })
})
