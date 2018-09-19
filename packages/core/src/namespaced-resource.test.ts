import {
  clearNamespacedResources,
  registerNamespacedResource,
  subscribeToNamespace,
  consumeNamespace,
} from './namespaced-resource'
import storage from './storage'
import { defaultResource } from './resource'

beforeEach(() => {
  clearNamespacedResources()
  storage.clear()
})

const accounts = {
  'bob@mail.com': { name: 'Bob', surname: 'Sponge' },
  'lucifer@hell.com': { name: 'Lucifer', surname: 'Morning-star' },
}
const loaded1 = { 'bob@mail.com': {
  ...defaultResource,
  loaded: true,
  data: accounts['bob@mail.com'],
} }
const loaded2 = { 'lucifer@hell.com': {
  ...defaultResource,
  loaded: true,
  data: accounts['lucifer@hell.com'],
} }

test('should work', async () => {
  const consumer = jest.fn()
  await registerNamespacedResource('accounts', {
    source: ({ namespace }) => accounts[namespace],
  })
  subscribeToNamespace('accounts', consumer)

  await consumeNamespace('accounts', 'bob@mail.com') // call first namespace
  expect(consumer.mock.calls.length).toBe(3)
  expect(consumer.mock.calls[0][0]).toEqual({ 'bob@mail.com': defaultResource })
  expect(consumer.mock.calls[1][0]).toEqual({ 'bob@mail.com': { ...defaultResource, loading: true } })
  expect(consumer.mock.calls[2][0]).toEqual(loaded1)
  await consumeNamespace('accounts', 'bob@mail.com') // do nothing
  await consumeNamespace('accounts', 'lucifer@hell.com') // call second namespace
  expect(consumer.mock.calls.length).toBe(6)
  expect(consumer.mock.calls[3][0]).toEqual({ ...loaded1, 'lucifer@hell.com': defaultResource })
  expect(consumer.mock.calls[4][0]).toEqual({ ...loaded1, 'lucifer@hell.com': { ...defaultResource, loading: true } })
  expect(consumer.mock.calls[5][0]).toEqual({ ...loaded1, ...loaded2 })
})
