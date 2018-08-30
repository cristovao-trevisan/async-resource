import React from 'react'
import ReactTestRenderer from 'react-test-renderer'
import { createStore, combineReducers, Store } from 'redux'
import { Provider } from 'react-redux'
import { defaultResource } from '@async-resource/core'
import {
  applyResourceToStore,
  clear,
  reducers,
  registerResource,
} from '@async-resource/redux'

import { Resource, withResource } from './index'

let store: Store
const user = { name: 'Bob' }

beforeEach(() => {
  clear()
  registerResource('user', { source: async () => user })
  registerResource('error', { source: async () => { throw new Error('An Error') } })
  store = createStore(combineReducers(reducers))
  applyResourceToStore(store)
})

test('render props should work', (done) => {
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
    store.subscribe(() => {
      if (first) {
        expect(rendered.toJSON()!.children).toEqual(['Loading'])
        first = false
      } else {
        expect(rendered.toJSON()!.children).toEqual(['Bob'])
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
    store.subscribe(() => {
      if (first) {
        expect(rendered.toJSON()!.children).toEqual(['Loading'])
        first = false
      } else {
        expect(rendered.toJSON()!.children).toEqual(['An Error'])
        done()
      }
    })
  })
})
