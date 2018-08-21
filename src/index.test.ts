import { ResourceManager } from './index'

let resources = new ResourceManager()
beforeEach(() => {
  resources = new ResourceManager()
})

test('resource', async () => {
  resources.registerResource('user', {
    source: async ({ props }) => ({ name: 'Bob  ', surname: 'Sponge', ...props }),
  })

  resources.consume('user', { happy: true })
  resources.consume('user', { happy: true })
})
