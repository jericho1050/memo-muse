import { renderWithProviders } from '../../test/test-utils'
import CollageGrid from './CollageGrid'

const images = [
  { id: '1', url: 'image1.jpg' },
]

test('renders collage items', () => {
  const { getByRole } = renderWithProviders(
    <CollageGrid images={images} />,
  )
  expect(getByRole('img')).toBeInTheDocument()
})
