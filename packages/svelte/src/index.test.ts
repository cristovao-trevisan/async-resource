import { defaultResource, Resource, consume, consumeNamespace } from '@async-resource/core'
import {
  registerResource,
  useResource,
  clear,
  registerNamespacedResource,
  useNamespacedResource,
  NamespacedResourceStoreValue,
} from './index'

beforeEach(clear)

const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time))

describe('Resource', () => {
  test('should work', (done) => {
    const id = registerResource('test', {
      source: jest.fn(async ({ props }) => ({ ...props, test: true })),
    })
    const store = useResource(id, { props: { username: 'Mario' } })

    let count = 0
    function checkResults(resource: Resource) {
      switch (count) {
        case 0: {
          expect(resource).toStrictEqual({ ...defaultResource, loading: true })
          break
        }
        case 1: {
          expect(resource).toStrictEqual({
            ...defaultResource,
            loaded: true,
            data: { username: 'Mario', test: true },
          })
          done()
          break
        }
      }
      count += 1
    }
    store.subscribe(checkResults)
  })

  test('should unsubscribe correctly', async () => {
    const source = jest.fn(async () => ({ test: true }))
    const id = registerResource('test', { source })

    const store = useResource(id, { props: { username: 'Mario' } })
    const subscription = jest.fn()
    const unsubscribe = store.subscribe(subscription)
    await wait(5)
    expect(source.mock.calls.length).toBe(1)
    const calls = subscription.mock.calls.length
    // should not throw because of store is destroyed
    unsubscribe()
    await consume('test', { reload: true })
    expect(source.mock.calls.length).toBe(2)
    expect(subscription.mock.calls.length).toBe(calls) // not called again
  })

  test('should throw if resource is not registered', () => {
    expect(() => useResource('test', {})).toThrow("Resource 'test' not registered")
  })
})

describe('NamespacedResource', () => {
  test('should work', (done) => {
    const id = registerNamespacedResource('test', {
      source: jest.fn(async ({ props, namespace }) => ({ ...props, namespace, test: true })),
    })
    const store = useNamespacedResource(id)
    store.setNamespace('mario', { props: { username: 'Mario' } })

    let count = 0
    function checkResults(res: NamespacedResourceStoreValue) {
      switch (count) {
        case 0:
        case 1: {
          expect(res.resource).toStrictEqual(defaultResource)
          break
        }
        case 2: {
          expect(res.resource).toStrictEqual({ ...defaultResource, loading: true })
          break
        }
        case 3: {
          expect(res.resources.mario).toStrictEqual(res.resource)
          expect(res.resource).toStrictEqual({
            ...defaultResource,
            loaded: true,
            data: { username: 'Mario', namespace: 'mario', test: true },
          })
          store.setNamespace('luigi', { props: { username: 'Luigi' } })
          break
        }
        case 5: {
          expect(res.resources.luigi).toStrictEqual(defaultResource)
          break
        }
        case 6: {
          expect(res.resources.luigi).toStrictEqual({ ...defaultResource, loading: true })
          break
        }
        case 7: {
          expect(res.resources.luigi).toStrictEqual(res.resource)
          expect(res.resource).toStrictEqual({
            ...defaultResource,
            loaded: true,
            data: { username: 'Luigi', namespace: 'luigi', test: true },
          })
          done()
          break
        }
      }
      count += 1
    }
    store.subscribe(checkResults)
  })

  test('should unsubscribe correctly', async () => {
    const source = jest.fn(async () => ({ test: true }))
    const id = registerNamespacedResource('test', { source })

    const store = useNamespacedResource(id)
    store.setNamespace('mario', { props: { username: 'Mario' } })
    const subscription = jest.fn()
    const unsubscribe = store.subscribe(subscription)
    await wait(5)
    expect(source.mock.calls.length).toBe(1)
    const calls = subscription.mock.calls.length

    // should not throw because of store is destroyed
    unsubscribe()
    await consumeNamespace('test', 'mario', { reload: true })
    expect(source.mock.calls.length).toBe(2)
    expect(subscription.mock.calls.length).toBe(calls) // not called again
  })

  test('should throw if resource is not registered', () => {
    expect(() => useNamespacedResource('test')).toThrow("Namespaced resource 'test' not registered")
  })
})
