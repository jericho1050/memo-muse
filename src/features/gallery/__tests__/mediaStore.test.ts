import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMediaStore } from '../../../store/mediaStore'

interface MockMedia {
id: string
user_id: string
file_name: string
file_path: string
file_type: string
created_at: string
updated_at: string
thumbnail_url?: string
}

vi.mock('../../../lib/supabase', () => ({
supabase: {
auth: { getUser: vi.fn() },
storage: { from: vi.fn() },
from: vi.fn(),
},
}))

const { supabase } = await import('../../../lib/supabase')

const mockFile = () => new File(['data'], 'test.jpg', { type: 'image/jpeg' })

function resetStore() {
useMediaStore.setState({ media: [], loading: false, uploading: false, error: null })
}

describe('mediaStore', () => {
beforeEach(() => {
resetStore()
vi.clearAllMocks()
})

it('initial state', () => {
const state = useMediaStore.getState()
expect(state.media).toEqual([])
expect(state.loading).toBe(false)
expect(state.uploading).toBe(false)
expect(state.error).toBeNull()
})

it('media upload', async () => {
const file = mockFile()
const newMedia: MockMedia = {
id: '1',
user_id: '1',
file_name: file.name,
file_path: 'media/path',
file_type: file.type,
created_at: '',
updated_at: '',
thumbnail_url: 'url',
}

;(supabase.auth.getUser as vi.Mock).mockResolvedValue({ data: { user: { id: '1' } } })
const uploadMock = vi.fn().mockResolvedValue({ error: null })
const getPublicUrlMock = vi.fn().mockReturnValue({ data: { publicUrl: 'url' } })
;(supabase.storage.from as vi.Mock).mockReturnValue({ upload: uploadMock, getPublicUrl: getPublicUrlMock, remove: vi.fn() })
const insertMock = vi.fn().mockReturnThis()
const selectMock = vi.fn().mockReturnThis()
const singleMock = vi.fn().mockResolvedValue({ data: newMedia, error: null })
;(supabase.from as vi.Mock).mockReturnValue({ insert: insertMock, select: selectMock, single: singleMock })

const promise = useMediaStore.getState().uploadMedia(file, { taken_at: 'now' })
expect(useMediaStore.getState().uploading).toBe(true)
const result = await promise
expect(result).toEqual(newMedia)
expect(useMediaStore.getState().uploading).toBe(false)
expect(useMediaStore.getState().media[0]).toEqual(newMedia)
expect(uploadMock).toHaveBeenCalled()
expect(insertMock).toHaveBeenCalled()
})

it('media fetch', async () => {
const media: MockMedia = { id: 'a', user_id: '1', file_name: 'a.jpg', file_path: 'path', file_type: 'image/jpeg', created_at: '', updated_at: '' }
;(supabase.auth.getUser as vi.Mock).mockResolvedValue({ data: { user: { id: '1' } } })
const selectMock = vi.fn().mockReturnThis()
const eqMock = vi.fn().mockReturnThis()
const orderMock = vi.fn().mockResolvedValue({ data: [media], error: null })
;(supabase.from as vi.Mock).mockReturnValue({ select: selectMock, eq: eqMock, order: orderMock })

const promise = useMediaStore.getState().fetchMedia()
await Promise.resolve()
expect(useMediaStore.getState().loading).toBe(true)
await promise
expect(useMediaStore.getState().loading).toBe(false)
expect(useMediaStore.getState().media).toEqual([media])
})

it('media deletion', async () => {
const existing: MockMedia = { id: 'z', user_id: '1', file_name: 'z.jpg', file_path: 'path', file_type: 'image/jpeg', created_at: '', updated_at: '' }
useMediaStore.setState({ media: [existing], loading: false, uploading: false, error: null })

const removeMock = vi.fn().mockResolvedValue({ error: null })
;(supabase.storage.from as vi.Mock).mockReturnValue({ upload: vi.fn(), getPublicUrl: vi.fn(), remove: removeMock })
const deleteMock = vi.fn().mockReturnThis()
const eqMock = vi.fn().mockResolvedValue({ error: null })
;(supabase.from as vi.Mock).mockReturnValue({ delete: deleteMock, eq: eqMock })

const promise = useMediaStore.getState().deleteMedia('z')
expect(useMediaStore.getState().loading).toBe(true)
await promise
expect(useMediaStore.getState().loading).toBe(false)
expect(useMediaStore.getState().media).toEqual([])
expect(removeMock).toHaveBeenCalled()
expect(deleteMock).toHaveBeenCalled()
})

it('error handling', async () => {
const file = mockFile()
;(supabase.auth.getUser as vi.Mock).mockResolvedValue({ data: { user: { id: '1' } } })
const uploadMock = vi.fn().mockResolvedValue({ error: new Error('fail') })
;(supabase.storage.from as vi.Mock).mockReturnValue({ upload: uploadMock, getPublicUrl: vi.fn(), remove: vi.fn() })

const result = await useMediaStore.getState().uploadMedia(file, {})
expect(result).toBeNull()
expect(useMediaStore.getState().error).toBe('fail')
expect(useMediaStore.getState().uploading).toBe(false)
})
})
