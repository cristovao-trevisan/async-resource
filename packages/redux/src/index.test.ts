import { Store, createStore, combineReducers } from 'redux'
import { createStore as createDynamicStore } from 'redux-dynamic-reducer'

// tslint:disable-next-line:import-name
import connectResource, {
  consumeAction,
  reducers,
  registerResource,
  applyResourceToStore,
} from './index'
import {
  defaultResource,
  consume,
  consumeNamespace,
} from '@async-resource/core'

let store: Store<any> = createDynamicStore()
let {
  registerResource: registerDynamicResource,
  registerNamespacedResource: registerDynamicNamespacedResource,
} = connectResource(store)

beforeEach(() => {
  store = createDynamicStore();
  ({
    registerResource: registerDynamicResource,
    registerNamespacedResource: registerDynamicNamespacedResource,
  } = connectResource(store))
})

const user = { firstName: 'Bob', lastName: 'Sponge' }
const loadingResource = { ...defaultResource, loading: true }
const loadedResource = {
  ...defaultResource,
  loaded: true,
  data: user,
}

test('basic functionality', async () => {
  const states = []
  store.subscribe(() => states.push(store.getState().userResource))
  registerDynamicResource('user', {
    source: async () => user,
  })

  expect(store.getState().userResource).toEqual(defaultResource)
  await consume('user')
  expect(store.getState().userResource).toEqual(loadedResource)

  expect(states.length).toBe(4)
  expect(states[0]).toEqual(defaultResource) // default
  expect(states[1]).toEqual(defaultResource) // registering
  expect(states[2]).toEqual(loadingResource)
  expect(states[3]).toEqual(loadedResource)

  registerDynamicResource('info', {
    source: async () => 'information',
  })
  expect(store.getState().infoResource).toEqual(defaultResource)
  await consume('info')
  expect(store.getState().infoResource).toEqual({
    ...loadedResource,
    data: 'information',
  })
})

test('action trigger', (done) => {
  const states = []
  store.subscribe(() => states.push(store.getState().userResource))
  registerDynamicResource('user', {
    source: async () => user,
  })

  expect(store.getState().userResource).toEqual(defaultResource)
  store.dispatch(consumeAction('user'))

  setTimeout(
    () => {
      expect(store.getState().userResource).toEqual(loadedResource)

      expect(states[0]).toEqual(defaultResource) // initial state
      expect(states[1]).toEqual(defaultResource) // cache loading
      expect(states[2]).toEqual(defaultResource) // update action
      expect(states[3]).toEqual(loadingResource)
      expect(states[4]).toEqual(loadedResource)
      expect(states.length).toBe(5)
      done()
    },
    2,
  )
})

test('should work without redux-dynamic-reducer', async () => {
  registerResource('user', {
    source: async () => user,
  })
  registerResource('info', {
    source: async () => 'information',
  })
  store = createStore(combineReducers(reducers))
  applyResourceToStore(store)
  const states = [store.getState().userResource]
  store.subscribe(() => states.push(store.getState().userResource))

  expect(store.getState().userResource).toEqual(defaultResource)
  await consume('user')
  expect(store.getState().userResource).toEqual(loadedResource)

  expect(states[0]).toEqual(defaultResource)
  expect(states[1]).toEqual(loadingResource)
  expect(states[2]).toEqual(loadedResource)

  // testing multiple resources
  expect(store.getState().infoResource).toEqual(defaultResource)
  await consume('info')
  expect(store.getState().infoResource).toEqual({
    ...loadedResource,
    data: 'information',
  })
})

const email = 'bob@sponge.com'
test('basic namespaced functionality', async () => {
  const states = []
  store.subscribe(() => states.push(store.getState().userResource))
  registerDynamicNamespacedResource('user', {
    source: async () => user,
  })

  expect(store.getState().userResource).toEqual({})
  await consumeNamespace('user', email)
  expect(store.getState().userResource).toEqual({ [email]: loadedResource })

  expect(states.length).toBe(4)
  expect(states[0]).toEqual({}) // default
  expect(states[1]).toEqual({ [email]: defaultResource }) // registering
  expect(states[2]).toEqual({ [email]: loadingResource })
  expect(states[3]).toEqual({ [email]: loadedResource })
})
