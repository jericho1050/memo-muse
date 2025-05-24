import { screen, waitFor } from '../../test/utils'
import { renderWithProviders, userEvent } from '../../test/utils'
import { vi } from 'vitest'

let html2canvasMock: any
vi.mock('html2canvas-pro', () => ({ default: (...args: any[]) => html2canvasMock(...args) }))
vi.mock('jspdf', () => ({ default: vi.fn().mockImplementation(() => ({ addImage: vi.fn(), save: vi.fn() })) }))
import CollageExporter from '../CollageExporter'

const canvas = document.createElement('canvas')
canvas.toDataURL = vi.fn(() => 'data:image/png;base64,abc')
html2canvasMock = vi.fn().mockResolvedValue(canvas)

describe('CollageExporter', () => {
beforeEach(() => {
html2canvasMock.mockClear()
vi.spyOn(window, 'alert').mockImplementation(() => {})
})

afterEach(() => {
;(window.alert as unknown as vi.SpyInstance).mockRestore()
})

test('generates export preview', async () => {
const ref = { current: document.createElement('div') }
renderWithProviders(<CollageExporter targetRef={ref} />)
await userEvent.click(screen.getByText('Generate Export Preview'))
await waitFor(() => expect(html2canvasMock).toHaveBeenCalled())
expect(screen.getByText('Export Preview')).toBeInTheDocument()
const img = screen.getByAltText('Export preview') as HTMLImageElement
expect(img.src).toBe('data:image/png;base64,abc')
})

test('alerts when targetRef missing', async () => {
const ref = { current: null }
renderWithProviders(<CollageExporter targetRef={ref} />)
await userEvent.click(screen.getByText('Generate Export Preview'))
expect(window.alert).toHaveBeenCalledWith('Unable to find the collage to export. Please try again.')
expect(html2canvasMock).not.toHaveBeenCalled()
})
})
