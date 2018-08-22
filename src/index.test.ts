import { ResourceManager } from './index'
import storage from './storage'

let resources = new ResourceManager()
beforeEach(() => {
  resources = new ResourceManager()
  storage.clear()
})

test('resource', async () => {
  resources.registerResource('user', {
    source: async () => ({ name: 'Bob  ', surname: 'Sponge' }),
  })
  resources.registerConsumer('user', console.log)

  await resources.consume('user')
})
