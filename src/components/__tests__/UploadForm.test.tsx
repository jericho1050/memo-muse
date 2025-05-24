import { describe, it, expect, vi } from 'vitest'
import MediaUploader from '../MediaUploader'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockUploadMedia = vi.fn()
const storeState = {
media: [],
loading: false,
uploading: false,
error: null,
fetchMedia: vi.fn(),
uploadMedia: mockUploadMedia,
deleteMedia: vi.fn(),
}

globalThis.URL.createObjectURL = vi.fn(() => 'preview-url')

vi.mock('../MediaUploader', async () => {
const actual = await vi.importActual('../MediaUploader')
return { default: actual.default }
})

vi.mock('../../store/mediaStore', () => {
const useMediaStore = vi.fn(() => storeState)
useMediaStore.getState = () => storeState
return { useMediaStore }
})

vi.mock('../../utils/mediaUtils', () => ({
extractExifData: vi.fn(() => Promise.resolve({}))
}))

describe('UploadForm', () => {
it('does not render upload button with no files', () => {
  render(<MediaUploader />)
  const button = screen.queryByRole('button', { name: /upload all/i })
  expect(button).toBeNull()
})

it('uploads a file', async () => {
const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
render(<MediaUploader />)
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
await userEvent.upload(input, file)
expect(screen.getByText('photo.jpg')).toBeInTheDocument()
mockUploadMedia.mockResolvedValueOnce({})
const button = screen.getByRole('button', { name: /upload all/i })
await userEvent.click(button)
await waitFor(() => expect(mockUploadMedia).toHaveBeenCalled())
})

it('shows error on upload failure', async () => {
const file = new File(['img'], 'bad.jpg', { type: 'image/jpeg' })
render(<MediaUploader />)
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
await userEvent.upload(input, file)
mockUploadMedia.mockRejectedValueOnce(new Error('fail'))
await userEvent.click(screen.getByRole('button', { name: /upload all/i }))
await waitFor(() =>
expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
)
})

it('shows loading state', async () => {
  storeState.uploading = true
  const file = new File(['img'], 'wait.jpg', { type: 'image/jpeg' })
  render(<MediaUploader />)
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  await userEvent.upload(input, file)
  const button = screen.getByRole('button', { name: /uploading/i })
  expect(button).toBeDisabled()
  storeState.uploading = false
})

it('shows success state after upload', async () => {
  const file = new File(['img'], 'done.jpg', { type: 'image/jpeg' })
  render(<MediaUploader />)
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  await userEvent.upload(input, file)
  mockUploadMedia.mockResolvedValueOnce({})
  await userEvent.click(screen.getByRole('button', { name: /upload all/i }))
  await waitFor(() =>
    expect(document.querySelector('.bg-green-500')).toBeInTheDocument()
  )
})
})
