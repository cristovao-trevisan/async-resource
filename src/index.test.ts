import * as resources from './index'
import storage from './storage'

const { defaultResource } = resources
beforeEach(() => {
  resources.clear()
  storage.clear()
})

const user = { name: 'Bob  ', surname: 'Sponge' }
test('basic functionality', async () => {
  resources.registerResource('user', {
    source: async () => user,
  })

  const consumer = jest.fn()
  resources.subscribe('user', consumer)

  expect(consumer.mock.calls.length).toBe(1)
  expect(consumer.mock.calls[0][0]).toEqual(defaultResource)

  await resources.consume('user')
  // loading
  expect(consumer.mock.calls[1][0]).toEqual({ ...defaultResource, loading: true })
  // data
  expect(consumer.mock.calls[2][0]).toEqual({ ...defaultResource, loaded: true, data: user })
})

test('basic error handling', async () => {
  const message = 'I should throw'
  resources.registerResource('user', {
    source: async () => { throw new Error(message) },
  })

  const consumer = jest.fn()
  resources.subscribe('user', consumer)

  await resources.consume('user')
  // error
  expect(consumer.mock.calls[2][0]).toEqual({ ...defaultResource, error: message })
})

test('should read cache', async () => {
  const message = 'I should throw'
  storage.set('resource-user', { data: user , timestamp: Date.now() })
  const consumer = jest.fn()
  resources.subscribe('user', consumer)

  await resources.registerResource('user', {
    source: async () => { throw new Error(message) },
    cache: {},
  })

  expect(consumer.mock.calls.length).toBe(2)
  expect(consumer.mock.calls[0][0]).toEqual({ ...defaultResource, cache: true, loading: true })
  expect(consumer.mock.calls[1][0])
    .toEqual({ ...defaultResource, loaded: true, cache: true, data: user })
})

test('unsubscribe should work', async () => {
  resources.registerResource('user', {
    source: async () => user,
  })

  const consumer = jest.fn()
  resources.subscribe('user', consumer)

  expect(consumer.mock.calls.length).toBe(1)
  resources.unsubscribe('user', consumer)
  await resources.consume('user')
  expect(consumer.mock.calls.length).toBe(1)
})

test('should work for multiple consumers, with unsubscribe and reload', async () => {
  resources.registerResource('user', {
    source: async () => user,
  })

  const consumer1 = jest.fn()
  const consumer3 = jest.fn()
  resources.subscribe('user', consumer1)
  resources.subscribe('user', consumer3)

  await resources.consume('user')
  // first call
  expect(consumer1.mock.calls.length).toBe(3)
  expect(consumer3.mock.calls.length).toBe(3)
  // unregister consumer3
  resources.unsubscribe('user', consumer3)
  // call resource again
  await resources.consume('user', { reload: true })
  // second call for consumer1 only
  expect(consumer1.mock.calls.length).toBe(5)
  expect(consumer3.mock.calls.length).toBe(3)
})

test('should try to read cache, and call resource when it fails', async (done) => {
  const get = storage.get
  const consumer = jest.fn()
  const source = jest.fn(async () => user)

  storage.get = () => null

  resources.registerResource('user', {
    source,
    cache: {},
  })
  resources.subscribe('user', consumer)

  await resources.consume('user')

  // await cache failure
  setTimeout(
    () => {
      // reading cache
      expect(consumer.mock.calls[0][0]).toEqual({ ...defaultResource, cache: true, loading: true })
      // nothing found
      expect(consumer.mock.calls[1][0]).toEqual(defaultResource)
      // call source
      expect(source.mock.calls.length).toBe(1)
      expect(consumer.mock.calls[2][0]).toEqual({ ...defaultResource, loading: true })
      // loaded
      expect(consumer.mock.calls[3][0]).toEqual({ ...defaultResource, loaded: true, data: user })

      expect(consumer.mock.calls.length).toBe(4)

      done()
    },
    1)

  storage.get = get
})

test('should call resource only once', () => {
  const source = jest.fn()
  resources.registerResource('user', { source })

  for (let i = 0; i < 100; i += 1) resources.consume('user')
  expect(source.mock.calls.length).toBe(1)
})

test('cache TTL should work', async (done) => {
  const source = jest.fn(async () => user)
  // max duration of 5 milliseconds
  resources.registerResource('user', {
    source,
    cache: { TTL: 3 },
  })
  const consumer = jest.fn()
  resources.subscribe('user', consumer)

  await resources.consume('user')

  setTimeout(
    () => {
      // consume should be called after TTL (5ms),
      // so after 9ms the consumer is called again (loading and loaded)
      expect(source.mock.calls.length).toBe(2)
      expect(consumer.mock.calls.length).toBe(6)
      // try loading cache
      expect(consumer.mock.calls[0][0]).toEqual({ ...defaultResource, cache: true, loading: true })
      expect(consumer.mock.calls[1][0]).toEqual(defaultResource)
      // call source
      expect(consumer.mock.calls[2][0]).toEqual({ ...defaultResource, loading: true })
      expect(consumer.mock.calls[3][0]).toEqual({ ...defaultResource, loaded: true, data: user })
      // call source after TTL
      expect(consumer.mock.calls[4][0]).toEqual({ ...defaultResource, loading: true, loaded: true, data: user })
      expect(consumer.mock.calls[5][0]).toEqual({ ...defaultResource, loaded: true, data: user })
      done()
    },
    5,
  )
})
