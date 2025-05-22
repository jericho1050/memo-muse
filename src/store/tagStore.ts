import { create } from 'zustand'
import { supabase, Tag } from '../lib/supabase'

interface TagState {
tags: Tag[]
mediaTags: Record<string, Tag[]>
selectedFilter: string[]
loading: boolean
error: string | null
fetchTags: () => Promise<void>
fetchMediaTags: (mediaId: string) => Promise<Tag[]>
createTag: (name: string) => Promise<Tag | null>
addTagsToMedia: (mediaId: string, tagIds: string[]) => Promise<void>
removeTagFromMedia: (mediaId: string, tagId: string) => Promise<void>
toggleFilterTag: (tagId: string) => void
}

export const useTagStore = create<TagState>((set, get) => ({
tags: [],
mediaTags: {},
selectedFilter: [],
loading: false,
error: null,

fetchTags: async () => {
set({ loading: true })
const { data, error } = await supabase
.from('tags')
.select('*')
.order('name')
if (error) {
set({ error: error.message, loading: false })
return
}
set({ tags: data as Tag[], loading: false })
},

fetchMediaTags: async (mediaId: string) => {
const { data, error } = await supabase
.from('media_tags')
.select('tags(*)')
.eq('media_id', mediaId)
if (error) {
set({ error: error.message })
return []
}
const tagList = (data || []).map(mt => mt.tags as Tag)
set({ mediaTags: { ...get().mediaTags, [mediaId]: tagList } })
return tagList
},

createTag: async (name: string) => {
const { data: auth } = await supabase.auth.getUser()
const userId = auth.user?.id
if (!userId) return null
const { data, error } = await supabase
.from('tags')
.insert({ name, user_id: userId })
.select()
.single()
if (error) {
set({ error: error.message })
return null
}
set({ tags: [...get().tags, data as Tag] })
return data as Tag
},

addTagsToMedia: async (mediaId: string, tagIds: string[]) => {
const inserts = tagIds.map(id => ({ media_id: mediaId, tag_id: id }))
const { error } = await supabase.from('media_tags').insert(inserts)
if (error) {
set({ error: error.message })
return
}
const current = get().mediaTags[mediaId] || []
const added = get().tags.filter(t => tagIds.includes(t.id))
set({ mediaTags: { ...get().mediaTags, [mediaId]: [...current, ...added] } })
},

removeTagFromMedia: async (mediaId: string, tagId: string) => {
const { error } = await supabase
.from('media_tags')
.delete()
.match({ media_id: mediaId, tag_id: tagId })
if (error) {
set({ error: error.message })
return
}
const remaining = (get().mediaTags[mediaId] || []).filter(t => t.id !== tagId)
set({ mediaTags: { ...get().mediaTags, [mediaId]: remaining } })
},

toggleFilterTag: (tagId: string) => {
const list = get().selectedFilter
set({
selectedFilter: list.includes(tagId)
? list.filter(id => id !== tagId)
: [...list, tagId],
})
},
}))
