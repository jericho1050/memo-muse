import { useEffect } from 'react'
import { useTagStore } from '../store/tagStore'

export function TagFilter() {
const { tags, selectedFilter, fetchTags, toggleFilterTag } = useTagStore()

useEffect(() => {
fetchTags()
}, [fetchTags])

return (
<div className='flex flex-wrap gap-2 mb-4'>
{tags.map(tag => (
<label key={tag.id} className='flex items-center gap-1 text-sm'>
<input
type='checkbox'
checked={selectedFilter.includes(tag.id)}
onChange={() => toggleFilterTag(tag.id)}
/>
<span>{tag.name}</span>
</label>
))}
</div>
)
}
