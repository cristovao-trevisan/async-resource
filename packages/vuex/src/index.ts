import { Store, Module } from 'vuex'

import {
  defaultResource,
  consume,
  subscribe,
  registerResource,
  ConsumeOptions,
  Resource,
  Source,
} from '@async-resource/core'

export default (store: Store<{}>) => ({
  registerResource(id: string, options: Source) {
    const module: Module<Resource, any> = {
      namespaced: true,
      state: { ...defaultResource },
      mutations: {
        update (state, resource: Resource) { Object.assign(state, resource) },
      },
      actions: {
        consume({}, props: ConsumeOptions) { return consume(id, props) },
      },
    }
    registerResource(id, options)
    store.registerModule(`${id}Resource`, module)
    subscribe(id, resource => store.commit(`${id}Resource/update`, resource))
  },
})
