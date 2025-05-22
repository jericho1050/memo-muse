import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { useTagStore } from '../store/tagStore'

interface TagManagerProps {
mediaId: string
isOpen: boolean
onClose: () => void
}

export function TagManager({ mediaId, isOpen, onClose }: TagManagerProps) {
const {
tags,
mediaTags,
fetchTags,
fetchMediaTags,
createTag,
addTagsToMedia,
removeTagFromMedia,
} = useTagStore()
const [selected, setSelected] = useState<string[]>([])
const [newTag, setNewTag] = useState('')

useEffect(() => {
if (!isOpen) return
fetchTags()
fetchMediaTags(mediaId).then(list => setSelected(list.map(t => t.id)))
}, [isOpen, mediaId, fetchTags, fetchMediaTags])

const toggle = (id: string) => {
setSelected(prev =>
prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
)
}

const handleSave = async () => {
const current = mediaTags[mediaId]?.map(t => t.id) || []
const add = selected.filter(id => !current.includes(id))
const remove = current.filter(id => !selected.includes(id))
if (add.length) await addTagsToMedia(mediaId, add)
await Promise.all(remove.map(id => removeTagFromMedia(mediaId, id)))
onClose()
}

const handleAdd = async () => {
if (!newTag.trim()) return
let tag = tags.find(t => t.name.toLowerCase() === newTag.toLowerCase())
if (!tag) tag = await createTag(newTag) || undefined
if (tag) toggle(tag.id)
setNewTag('')
}

return (
<Modal isOpen={isOpen} onClose={onClose} title='Edit Tags'>
<div className='space-y-4'>
<div className='flex flex-wrap gap-2'>
{tags.map(t => (
<label key={t.id} className='flex items-center gap-1 text-sm'>
<input
type='checkbox'
checked={selected.includes(t.id)}
onChange={() => toggle(t.id)}
/>
<span>{t.name}</span>
</label>
))}
</div>
<div className='flex gap-2'>
<input
className='border px-2 py-1 flex-1'
value={newTag}
onChange={e => setNewTag(e.target.value)}
placeholder='New tag'
/>
<button
onClick={handleAdd}
className='px-3 py-1 bg-indigo-600 text-white rounded'
>
Add
</button>
</div>
<div className='flex justify-end gap-2'>
<button
onClick={onClose}
className='px-4 py-2 border rounded'
>
Cancel
</button>
<button
onClick={handleSave}
className='px-4 py-2 bg-indigo-600 text-white rounded'
>
Save
</button>
</div>
</div>
</Modal>
)
}
