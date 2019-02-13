import * as resources from './resource'
import storage from './storage'

const { defaultResource } = resources
const user = { name: 'Bob  ', surname: 'Sponge' }
beforeEach(() => {
  resources.purge()
  storage.clear()
})

describe('#update', () => {
  test('should work', async () => {
    const update = jest.fn(async ({ props, resource: { data } }) => ({ ...data, ...props }))
    resources.registerResource('user', {
      update,
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

    await resources.update('user', { name: 'John' })
    expect(update.mock.calls[0][0]).toMatchObject({ props: { name: 'John' } })
    // loading
    expect(consumer.mock.calls[3][0]).toEqual({
      ...defaultResource,
      loaded: true,
      updating: true,
      data: user,
    })
    // data
    expect(consumer.mock.calls[4][0]).toEqual({
      ...defaultResource,
      loaded: true,
      data: { name: 'John', surname: 'Sponge' },
    })
  })

  test('with error', async () => {
    resources.registerResource('user', {
      source: async () => user,
      update: async () => { throw new Error('Could not update') },
    })

    const consumer = jest.fn()
    resources.subscribe('user', consumer)

    await resources.consume('user')
    await resources.update('user', { name: 'John' }).catch(() => null)
    const loaded = { ...defaultResource, loaded: true, data: user }
    expect(consumer.mock.calls[2][0]).toEqual(loaded)
    // loading
    expect(consumer.mock.calls[3][0]).toEqual({
      ...defaultResource,
      loaded: true,
      updating: true,
      data: user,
    })
    // return to loaded state
    expect(consumer.mock.calls[4][0]).toEqual(loaded)
  })

  test('should throw if resourece is not found', () =>
    expect(resources.update('user', {})).rejects.toBeTruthy())

  test('should throw if update was not registered', () => {
    resources.registerResource('user', {
      source: () => null,
    })

    return expect(resources.update('user', {})).rejects.toBeTruthy()
  })

  test('should execute only 1 update concurrently', async () => {
    const update = jest.fn()
    resources.registerResource('user', {
      update,
      source: () => null,
    })

    await Promise.all([0, 1].map(() => resources.update('user', {})))

    expect(update.mock.calls.length).toBe(1)
  })
})
