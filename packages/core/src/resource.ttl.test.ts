import * as resources from './resource'
import storage from './storage'

const { defaultResource } = resources
const user = { name: 'Bob  ', surname: 'Sponge' }
const ttlTimeout = 1000
beforeEach(() => {
  jest.useFakeTimers()
  resources.purge()
  storage.clear()
})

test('TTL should work', async () => {
  let count = 0
  const source = jest.fn(() => {
    count += 1
    return { ...user, count }
  })
  await storage.set('userResource', { data: user, timestamp: Date.now() })

  const consumer = jest.fn()
  resources.subscribe('user', consumer)
  await resources.registerResource('user', {
    source,
    TTL: ttlTimeout,
    cache: {},
  })

  await resources.consume('user')
  expect(source.mock.calls.length).toBe(0)

  await jest.advanceTimersByTime(ttlTimeout)
  await jest.advanceTimersByTime(ttlTimeout)

  expect(source.mock.calls.length).toBe(2)
  expect(consumer.mock.calls.length).toBe(6)
    // load from cache
  expect(consumer.mock.calls[0][0]).toEqual({ ...defaultResource, cache: true, loading: true })
  expect(consumer.mock.calls[1][0]).toEqual({ ...defaultResource, cache: true, loaded: true, data: user })
  // call source after TTL
  expect(consumer.mock.calls[2][0]).toEqual({
    ...defaultResource,
    cache: true,
    loaded: true,
    loading: true,
    data: user,
  })
  expect(consumer.mock.calls[3][0]).toEqual({
    ...defaultResource,
    loaded: true,
    loading: false,
    data: { ...user, count: 1 },
  })
            // call source again TTL
  expect(consumer.mock.calls[4][0]).toEqual({
    ...defaultResource,
    loaded: true,
    loading: true,
    data: { ...user, count: 1 },
  })
  expect(consumer.mock.calls[5][0]).toEqual({
    ...defaultResource,
    loaded: true,
    loading: false,
    data: { ...user, count: 2 },
  })
})

test('ttl unsubscription should work', async () => {
  const total = 5

  const source = jest.fn(() => user)
  await resources.registerResource('user', {
    source,
    TTL: ttlTimeout,
  })

  const unsubscribes = await Promise.all(Array(total).fill(null)
    .map(() => resources.consume('user')))

  await jest.advanceTimersByTime(ttlTimeout)
  expect(source.mock.calls.length).toBe(2)

  // test consume while loading
  const loadingConsumption = resources.consume('user', { reload: true })
  unsubscribes.push(await resources.consume('user'))
  unsubscribes.push(await loadingConsumption)

  unsubscribes.forEach(unsubscribe => unsubscribe())

  await jest.advanceTimersByTime(ttlTimeout)
  expect(source.mock.calls.length).toBe(3)
})
