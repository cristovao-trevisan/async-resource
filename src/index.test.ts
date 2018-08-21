import { ResourceManager } from './index'

let resources = new ResourceManager()
beforeEach(() => {
  resources = new ResourceManager()
})

test('resource', async () => {
  resources.registerResource('user', {
    source: async () => ({ name: 'Bob  ', surname: 'Sponge' }),
  })

  await resources.consume('user')
  await resources.consume('user')
})
