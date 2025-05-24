import { describe, it, expect, afterEach, vi } from 'vitest'

var authMock: { getUser: ReturnType<typeof vi.fn> }
var fromMock: ReturnType<typeof vi.fn>

vi.mock('../../../lib/supabase', () => {
authMock = { getUser: vi.fn() }
fromMock = vi.fn()
return { supabase: { auth: authMock, from: fromMock } }
})

import { useCollectionStore } from '../../../store/collectionStore'

interface Collection {
id: string
user_id: string
title: string
created_at: string
updated_at: string
}

interface Media {
id: string
user_id: string
file_name: string
file_path: string
file_type: string
created_at: string
updated_at: string
}

const initialState = useCollectionStore.getState()

afterEach(() => {
vi.clearAllMocks()
useCollectionStore.setState(initialState)
})

function mockFromOnce(impl: (table: string) => any) {
fromMock.mockImplementationOnce(impl)
}

function createCollectionData(id = 'c1'): Collection {
return { id, user_id: 'u1', title: 'Test', created_at: '', updated_at: '' }
}

function createMediaData(id = 'm1'): Media {
return {
id,
user_id: 'u1',
file_name: 'a.jpg',
file_path: 'a.jpg',
file_type: 'image/jpeg',
created_at: '',
updated_at: '',
}
}


describe('collection store', () => {
it('fetchCollections sets collections and loading state', async () => {
const collection = createCollectionData()
mockFromOnce(() => ({
select: vi.fn().mockReturnThis(),
order: vi.fn().mockResolvedValue({ data: [collection], error: null }),
}))
const promise = useCollectionStore.getState().fetchCollections()
expect(useCollectionStore.getState().loading).toBe(true)
const result = await promise
expect(result).toEqual([collection])
expect(useCollectionStore.getState().collections).toEqual([collection])
expect(useCollectionStore.getState().loading).toBe(false)
expect(useCollectionStore.getState().error).toBeNull()
})

it('createCollection adds a new collection', async () => {
authMock.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
const collection = createCollectionData('c2')
mockFromOnce(() => ({
insert: vi.fn().mockReturnThis(),
select: vi.fn().mockReturnThis(),
single: vi.fn().mockResolvedValue({ data: collection, error: null }),
}))
mockFromOnce(() => ({
insert: vi.fn().mockResolvedValue({ error: null }),
}))
const result = await useCollectionStore.getState().createCollection('New', ['m1'])
expect(authMock.getUser).toHaveBeenCalled()
expect(result).toEqual(collection)
expect(useCollectionStore.getState().collections[0]).toEqual(collection)
expect(useCollectionStore.getState().loading).toBe(false)
})

it('fetchCollectionMedia caches media items', async () => {
const media = createMediaData()
mockFromOnce(() => ({
select: vi.fn().mockReturnThis(),
eq: vi.fn().mockResolvedValue({ data: [{ media_id: media.id }], error: null }),
}))
mockFromOnce(() => ({
select: vi.fn().mockReturnThis(),
in: vi.fn().mockResolvedValue({ data: [media], error: null }),
}))
const result1 = await useCollectionStore.getState().fetchCollectionMedia('c1')
expect(result1).toEqual([media])
expect(useCollectionStore.getState().collectionMedia['c1']).toEqual([media])
await useCollectionStore.getState().fetchCollectionMedia('c1')
expect(fromMock).toHaveBeenCalledTimes(2)
})

it('handles errors and stores message', async () => {
mockFromOnce(() => ({
select: vi.fn().mockReturnThis(),
order: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
}))
await useCollectionStore.getState().fetchCollections()
expect(useCollectionStore.getState().error).toBe('fail')
expect(useCollectionStore.getState().collections).toEqual([])
})
})
