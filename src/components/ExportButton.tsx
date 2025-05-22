import { useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { Modal } from './Modal'

interface ExportButtonProps {
targetRef: React.RefObject<HTMLElement>
}

type Format = 'png' | 'jpeg' | 'pdf'

/**
 * Button and modal for exporting a collage element as an image or PDF
 */
function ExportButton({ targetRef }: ExportButtonProps) {
const [open, setOpen] = useState(false)
const [preview, setPreview] = useState<string | null>(null)
const [format, setFormat] = useState<Format>('png')
const [processing, setProcessing] = useState(false)
const [error, setError] = useState<string | null>(null)

const generatePreview = async () => {
if (!targetRef.current) return
setProcessing(true)
setError(null)
try {
const canvas = await html2canvas(targetRef.current, { scale: 2 })
const mime = format === 'pdf' ? 'image/png' : `image/${format}`
setPreview(canvas.toDataURL(mime))
} catch {
setError('Failed to capture collage')
}
setProcessing(false)
}

const download = () => {
if (!preview) return
if (format === 'pdf') {
const pdf = new jsPDF('p', 'mm', 'a4')
const imgProps = pdf.getImageProperties(preview)
const width = pdf.internal.pageSize.getWidth()
const height = (imgProps.height * width) / imgProps.width
pdf.addImage(preview, 'PNG', 0, 0, width, height)
pdf.save('collage.pdf')
} else {
const link = document.createElement('a')
link.href = preview
link.download = `collage.${format}`
link.click()
}
}

const openModal = async () => {
await generatePreview()
setOpen(true)
}

return (
<>
<button
onClick={openModal}
className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
>
Export
</button>
<Modal isOpen={open} onClose={() => setOpen(false)} title="Export Collage">
{processing ? (
<p className="text-center">Preparing...</p>
) : (
preview && (
<div className="space-y-4">
<img src={preview} alt="Preview" className="max-w-full" />
<div className="flex items-center justify-between">
<select
value={format}
onChange={(e) => setFormat(e.target.value as Format)}
className="border rounded p-2"
>
<option value="png">PNG</option>
<option value="jpeg">JPEG</option>
<option value="pdf">PDF</option>
</select>
<button
onClick={download}
className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
>
Download
</button>
</div>
{error && <p className="text-red-500 text-sm">{error}</p>}
</div>
)
)}
</Modal>
</>
)
}

export default ExportButton
