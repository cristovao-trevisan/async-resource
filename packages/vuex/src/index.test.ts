import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import connectResource from './index'
import { defaultResource, consume } from '@async-resource/core'

Vue.use(Vuex)

let store: any = new Store({})
let { registerResource } = connectResource(store)

beforeEach(() => {
  store = new Store({});
  ({ registerResource } = connectResource(store))
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
  store.subscribe(() => states.push({ ...store.state.userResource }))

  registerResource('user', {
    source: async () => user,
  })
  expect(store.state.userResource).toEqual(defaultResource)
  await consume('user')
  expect(store.state.userResource).toEqual(loadedResource)

  expect(states.length).toBe(3)
  expect(states[0]).toEqual(defaultResource)
  expect(states[1]).toEqual(loadingResource)
  expect(states[2]).toEqual(loadedResource)
})

test('action trigger', async () => {
  const states = []
  store.subscribe(() => states.push({ ...store.state.userResource }))

  registerResource('user', {
    source: async () => user,
  })
  expect(store.state.userResource).toEqual(defaultResource)
  await store.dispatch('userResource/consume')
  expect(store.state.userResource).toEqual(loadedResource)

  expect(states.length).toBe(3)
  expect(states[0]).toEqual(defaultResource)
  expect(states[1]).toEqual(loadingResource)
  expect(states[2]).toEqual(loadedResource)
})
