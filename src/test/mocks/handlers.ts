import { rest } from 'msw'
import { setupServer } from 'msw/node'

export const handlers = [
  rest.get('/health', (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ status: 'ok' })),
  ),
]

export const server = setupServer(...handlers)
