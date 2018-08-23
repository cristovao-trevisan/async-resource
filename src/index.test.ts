import { ResourceManager, defaultResource } from './index'
import storage from './storage'

let resources = new ResourceManager()
beforeEach(() => {
  resources = new ResourceManager()
  storage.clear()
})

const user = { name: 'Bob  ', surname: 'Sponge' }
test('basic functionality', async () => {
  resources.registerResource('user', {
    source: async () => user,
  })

  const result = jest.fn()
  resources.subscribe('user', result)

  expect(result.mock.calls.length).toBe(0)
  await resources.consume('user')
  // loading
  expect(result.mock.calls[0][0]).toEqual({ ...defaultResource, loading: true })
  // data
  expect(result.mock.calls[1][0]).toEqual({ ...defaultResource, loaded: true, data: user })
})

test('basic error handling', async () => {
  const message = 'I should throw'
  resources.registerResource('user', {
    source: async () => { throw new Error(message) },
  })

  const result = jest.fn()
  resources.subscribe('user', result)

  expect(result.mock.calls.length).toBe(0)
  await resources.consume('user')
  // loading
  expect(result.mock.calls[0][0]).toEqual({ ...defaultResource, loading: true })
  // error
  expect(result.mock.calls[1][0]).toEqual({ ...defaultResource, error: message })
})

test('should read cache', async () => {
  const message = 'I should throw'
  storage.set('resource-user', { data: user , timestamp: Date.now() })
  const result = jest.fn()
  resources.subscribe('user', result)

  await resources.registerResource('user', {
    source: async () => { throw new Error(message) },
    cache: {},
  })

  expect(result.mock.calls[0][0])
    .toEqual({ ...defaultResource, loaded: true, cache: true, data: user })
})

test.skip('unsubscribe should work', () => null)
test.skip('should work for multiple consumers', () => null)
test.skip('cache TTL', () => null)
test.skip('cache should node overwrite requested data', () => null)
test.skip('should call resource only once', () => null)
test.skip('reload should work', () => null)
