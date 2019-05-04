import React from 'react'
import ReactTestRenderer from 'react-test-renderer'
import { createStore, combineReducers, Store } from 'redux'
import { Provider } from 'react-redux'
import { defaultResource, purge } from '@async-resource/core'
import {
  applyResourceToStore,
  clear,
  reducers,
  registerResource,
  registerNamespacedResource,
} from '@async-resource/redux'

import { Resource, Resources, withResource, NamespacedResource, NamespacedResources } from './index'

let store: Store
const user = { name: 'Bob' }
const team = 'Sea'

beforeEach(() => {
  clear()
  purge()
  registerResource('user', { source: async () => user })
  registerResource('team', { source: async () => team })
  registerNamespacedResource('events', { source: async ({ namespace = 'test' }) => `event-${namespace}` })
  registerNamespacedResource('tags', { source: async ({ namespace = 'test' }) => `tag-${namespace}` })
  registerResource('error', { source: async () => { throw new Error('An Error') } })
  registerNamespacedResource('namespacedError', { source: async () => { throw new Error('An Error') } })
  store = createStore(combineReducers(reducers))
  applyResourceToStore(store)
})

// FIXME: add tests for unsubscription

describe('render props', () => {
  test('should work', (done) => {
    let count = 0
    ReactTestRenderer.create(
      <Provider store={store}>
        <Resource id="user" render={(resource) => {
          count += 1
          switch (count) {
            case 1:
              expect(resource).toEqual({ ...defaultResource, loading: true })
              break
            case 2:
              expect(resource).toEqual({ ...defaultResource, loading: true })
              break
            case 3:
              expect(resource).toEqual({ ...defaultResource, loaded: true, data: user })
              done()
              break
          }
          if (resource.loading) return <div> Loading </div>
          if (resource.loaded) return <div> Data: { resource.data.name } </div>
          throw new Error('should not get here')
        }}
      />
      </Provider>,
    )
  })
})

describe('HOC', () => {
  test('should work', (done) => {
    // tslint:disable-next-line:variable-name
    const ResourceComponent = withResource('user', {
      Loading: () => <div>Loading</div>,
      Loaded: ({ data: { name } }) => <div>{ name }</div>,
    })

    const rendered = ReactTestRenderer.create(
      <Provider store={store}>
        <ResourceComponent />
      </Provider>,
    )

    let first = true
    const unsubscribe = store.subscribe(() => {
      if (first) {
        expect(rendered.toJSON()!.children).toEqual(['Loading'])
        first = false
      } else {
        expect(rendered.toJSON()!.children).toEqual(['Bob'])
        unsubscribe()
        done()
      }
    })
  })

  test('with error', (done) => {
    // tslint:disable-next-line:variable-name
    const ResourceComponent = withResource('error', {
      Loading: () => <div>Loading</div>,
      Loaded: ({ data: { name } }) => <div>{ name }</div>,
      Error: ({ error }) => <div>{ error }</div>,
    })

    const rendered = ReactTestRenderer.create(
      <Provider store={store}>
        <ResourceComponent />
      </Provider>,
    )

    let first = true
    const unsubscribe = store.subscribe(() => {
      if (first) {
        expect(rendered.toJSON()!.children).toEqual(['Loading'])
        first = false
      } else {
        expect(rendered.toJSON()!.children).toEqual(['An Error'])
        unsubscribe()
        done()
      }
    })
  })
})

describe('render props with multiple resources', () => {
  test('should work', (done) => {
    let count = 0
    ReactTestRenderer.create(
      <Provider store={store}>
        <Resources ids={['user', 'team']} render={(resources, all) => {
          count += 1
          expect(all.error).toBeNull() // no error in this test
          switch (count) {
            case 2: // loading first resource
              expect(all.loading).toBe(true)
              expect(all.loaded).toBe(false)
              expect(resources.user).toEqual({ ...defaultResource, loading: true })
              expect(resources.team).toEqual(defaultResource)
              break
            case 3: // loading second resource
              expect(all.loading).toBe(true)
              expect(all.loaded).toBe(false)
              expect(resources.user).toEqual({ ...defaultResource, loading: true })
              expect(resources.team).toEqual({ ...defaultResource, loading: true })
              break
            case 4: // loaded first resource
              expect(all.loading).toBe(true)
              expect(all.loaded).toBe(false)
              expect(resources.user).toEqual({ ...defaultResource, loaded: true, data: user })
              expect(resources.team).toEqual({ ...defaultResource, loading: true })
              break
            case 5: // loaded second resource
              expect(all.loading).toBe(false)
              expect(all.loaded).toBe(true)
              expect(resources.user).toEqual({ ...defaultResource, loaded: true, data: user })
              expect(resources.team).toEqual({ ...defaultResource, loaded: true, data: team })
              done()
              break
          }
          return <div> Testing </div>
        }}
      />
      </Provider>,
    )
  })

  test('should correctly accumulate error', (done) => {
    let count = 0
    ReactTestRenderer.create(
      <Provider store={store}>
        <Resources ids={['user', 'error']} render={(resources, all) => {
          count += 1
          switch (count) {
            case 2: // loading first resource
              expect(all.loading).toBe(true)
              expect(all.loaded).toBe(false)
              expect(all.error).toBeNull()
              expect(resources.user).toEqual({ ...defaultResource, loading: true })
              expect(resources.error).toEqual(defaultResource)
              break
            case 3: // loading second resource
              expect(all.loading).toBe(true)
              expect(all.loaded).toBe(false)
              expect(all.error).toBeNull()
              expect(resources.user).toEqual({ ...defaultResource, loading: true })
              expect(resources.error).toEqual({ ...defaultResource, loading: true })
              break
            case 4: // loaded first resource
              expect(all.loading).toBe(true)
              expect(all.loaded).toBe(false)
              expect(all.error).toBeNull()
              expect(resources.user).toEqual({ ...defaultResource, loaded: true, data: user })
              expect(resources.error).toEqual({ ...defaultResource, loading: true })
              break
            case 5: // loaded second resource (with error)
              expect(all.loading).toBe(false)
              expect(all.loaded).toBe(false)
              expect(all.error).toBe('An Error')
              expect(resources.user).toEqual({ ...defaultResource, loaded: true, data: user })
              expect(resources.error).toEqual({ ...defaultResource, error: 'An Error' })
              done()
              break
          }
          return <div> Testing </div>
        }}
      />
      </Provider>,
    )
  })
})

describe('namespaced resource', () => {
  test('should work', (done) => {
    let count = 0
    ReactTestRenderer.create(
      <Provider store={store}>
        <NamespacedResource id="events" namespace="party" render={(namespace, resource) => {
          count += 1
          switch (count) {
            case 1:
            case 2:
              expect(namespace).toEqual({ ...defaultResource, loading: true })
              break
            case 3:
              expect(namespace).toEqual({ ...defaultResource, loading: true })
              break
            case 4:
              expect(namespace).toEqual({ ...defaultResource, loaded: true, data: 'event-party' })
              done()
              break
          }
          if (namespace.loading) return <div> Loading </div>
          if (namespace.loaded) return <div> Data: { resource.data } </div>
          throw new Error('should not get here')
        }}
      />
      </Provider>,
    )
  })
})

describe('render props with multiple namespaced resources', () => {
  test('should work', (done) => {
    let count = 0
    ReactTestRenderer.create(
      <Provider store={store}>
        <NamespacedResources ids={['events', 'tags']} namespace="party" render={(namespaces, all) => {
          count += 1
          switch (count) {
            case 3: // loading first resource
              expect(all.loading).toBe(true)
              expect(all.loaded).toBe(false)
              expect(namespaces.events).toEqual({ ...defaultResource, loading: true })
              expect(namespaces.tags).toEqual(defaultResource)
              break
            case 5: // loading second resource
              expect(all.loading).toBe(true)
              expect(all.loaded).toBe(false)
              expect(namespaces.events).toEqual({ ...defaultResource, loading: true })
              expect(namespaces.tags).toEqual({ ...defaultResource, loading: true })
              break
            case 6: // loaded first resource
              expect(all.loading).toBe(true)
              expect(all.loaded).toBe(false)
              expect(namespaces.events).toEqual({ ...defaultResource, loaded: true, data: 'event-party' })
              expect(namespaces.tags).toEqual({ ...defaultResource, loading: true })
              break
            case 7: // loaded second resource
              expect(all.loading).toBe(false)
              expect(all.loaded).toBe(true)
              expect(namespaces.events).toEqual({ ...defaultResource, loaded: true, data: 'event-party' })
              expect(namespaces.tags).toEqual({ ...defaultResource, loaded: true, data: 'tag-party' })
              done()
              break
          }
          return <div> Testing </div>
        }}
      />
      </Provider>,
    )
  })

  test('should correctly accumulate error', (done) => {
    let count = 0
    ReactTestRenderer.create(
      <Provider store={store}>
        <NamespacedResources ids={['events', 'namespacedError']} namespace="party"  render={(resources, all) => {
          count += 1
          switch (count) {
            case 3: // loading first resource
              expect(all.loading).toBe(true)
              expect(all.loaded).toBe(false)
              expect(all.error).toBeNull()
              expect(resources.events).toEqual({ ...defaultResource, loading: true })
              expect(resources.namespacedError).toEqual(defaultResource)
              break
            case 5: // loading second resource
              expect(all.loading).toBe(true)
              expect(all.loaded).toBe(false)
              expect(all.error).toBeNull()
              expect(resources.events).toEqual({ ...defaultResource, loading: true })
              expect(resources.namespacedError).toEqual({ ...defaultResource, loading: true })
              break
            case 6: // loaded first resource
              expect(all.loading).toBe(true)
              expect(all.loaded).toBe(false)
              expect(all.error).toBeNull()
              expect(resources.events).toEqual({ ...defaultResource, loaded: true, data: 'event-party' })
              expect(resources.namespacedError).toEqual({ ...defaultResource, loading: true })
              break
            case 7: // loaded second resource (with error)
              expect(all.loading).toBe(false)
              expect(all.loaded).toBe(false)
              expect(all.error).toBe('An Error')
              expect(resources.events).toEqual({ ...defaultResource, loaded: true, data: 'event-party' })
              expect(resources.namespacedError).toEqual({ ...defaultResource, error: 'An Error' })
              done()
              break
          }
          return <div> Testing </div>
        }}
      />
      </Provider>,
    )
  })
})
