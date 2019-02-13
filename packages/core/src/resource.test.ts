import * as resources from './resource'
import storage from './storage'
import { wait } from './helpers'

const { defaultResource } = resources
const user = { name: 'Bob  ', surname: 'Sponge' }
beforeEach(() => {
  resources.purge()
  storage.clear()
})

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

test('#consume should throw if resource is not found', () =>
  expect(resources.consume('user')).rejects.toBeTruthy())

test('should read cache', async () => {
  const message = 'I should throw'
  storage.set('userResource', { data: user , timestamp: Date.now() })
  const consumer = jest.fn()
  const source = jest.fn(async () => null)
  resources.subscribe('user', consumer)
  await resources.registerResource('user', {
    source,
    cache: {},
  })

  expect(source.mock.calls.length).toBe(0)
  expect(consumer.mock.calls.length).toBe(2)
  expect(consumer.mock.calls[0][0]).toEqual({ ...defaultResource, cache: true, loading: true })
  expect(consumer.mock.calls[1][0])
    .toEqual({ ...defaultResource, loaded: true, cache: true, data: user })
})

test('listener unsubscribe should work', async () => {
  resources.registerResource('user', {
    source: async () => user,
  })

  const consumer = jest.fn()
  const unsubscribe = resources.subscribe('user', consumer)

  expect(consumer.mock.calls.length).toBe(1)
  unsubscribe()
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

test('should try to read cache, and call resource when it fails', async () => {
  const consumer = jest.fn()
  const source = jest.fn(async () => user)

  resources.subscribe('user', consumer)
  resources.registerResource('user', {
    source,
    cache: {},
  })

  resources.consume('user')
  await wait(1) // wait cache read

  // reading cache
  expect(consumer.mock.calls[0][0]).toEqual({ ...defaultResource, cache: true, loading: true })
  // nothing found
  expect(consumer.mock.calls[1][0]).toEqual(defaultResource)
  // call source
  expect(source.mock.calls.length).toBe(1)
  expect(consumer.mock.calls[2][0]).toEqual({ ...defaultResource, loading: true })
  // loaded
  expect(consumer.mock.calls[3][0]).toEqual({ ...defaultResource, loaded: true, data: user })
  expect(await storage.get('userResource')).toMatchObject({ data: user })
  expect(consumer.mock.calls.length).toBe(4)
})

test('should call resource only once', () => {
  const source = jest.fn()
  resources.registerResource('user', { source })

  for (let i = 0; i < 100; i += 1) resources.consume('user')
  expect(source.mock.calls.length).toBe(1)
})

test('cache TTL should work', async () => {
  const source = jest.fn(async () => user)
  storage.set('userResource', { data: user , timestamp: Date.now() - 6 })
  // max duration of 5 milliseconds
  await resources.registerResource('user', {
    source,
    cache: { TTL: 3 },
  })

  await resources.consume('user')
  expect(source.mock.calls.length).toBe(1)
})

describe('clear', () => {
  test('should clear internal variable and storage item', async () => {
    await resources.registerResource('user', {
      source: async () => user,
      cache: {},
    })

    const consumer = jest.fn()
    resources.subscribe('user', consumer)

    await resources.consume('user')

    expect(resources.get('user')).toMatchObject({ data: user })
    expect(await storage.get(resources.identifier('user'))).toMatchObject({ data: user })
    resources.clear()

    expect(resources.get('user')).toEqual(defaultResource)
    expect(await storage.get(resources.identifier('user'))).toBeNull()
    const lastCall = consumer.mock.calls.length - 1
    expect(consumer.mock.calls[lastCall][0]).toEqual(defaultResource) // should clear in consumers
  })
})

describe('purge', () => {
  test('should clear everything', async () => {
    await resources.registerResource('user', {
      source: async () => user,
      cache: {},
    })

    const consumer = jest.fn()
    resources.subscribe('user', consumer)

    await resources.consume('user')

    expect(resources.get('user')).toMatchObject({ data: user })
    expect(await storage.get(resources.identifier('user'))).toMatchObject({ data: user })
    resources.purge()

    expect(resources.get('user')).toBeUndefined()
    expect(await storage.get(resources.identifier('user'))).toBeNull()
    const lastCall = consumer.mock.calls.length - 1
    expect(consumer.mock.calls[lastCall][0]).toEqual(defaultResource) // should clear in consumers
  })
})
