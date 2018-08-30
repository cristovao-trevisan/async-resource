import {
  Store,
  Reducer,
  AnyAction,
} from 'redux'

import {
  Source,
  Resource,
  ConsumeOptions,
  registerResource as register,
  consume as callConsume,
  subscribe,
  defaultResource,
} from '@async-resource/core'

export const updateKey = (id: string) => `update-resource-${id}`
export const consumeKey = (id: string) => `consume-resource-${id}`
export const reducerKey = (id: string) => `${id}Resource`

export const consumeAction = (id: string, props?: ConsumeOptions) => ({ props, type: consumeKey(id) })

type ResourceReducer = Reducer<Resource, AnyAction>

interface NestableReducersMapObject {
  [key: string]: (NestableReducersMapObject | Reducer<any>)
}
interface DynamicStore extends Store {
  attachReducers(reducers: NestableReducersMapObject): void
}

export default (store: DynamicStore) => ({
  registerResource: (id: string, options: Source) => {
    // actions
    const update = updateKey(id)
    const consume = consumeKey(id)
    // reducer
    const reducer: ResourceReducer = (resource = defaultResource, action) => {
      switch (action.type) {
        case update: return action.resource
        case consume: setTimeout(() => callConsume(id, action.props))
        default: return resource
      }
    }
    // building
    const reducerId = reducerKey(id)
    store.attachReducers({ [reducerId]: reducer })
    register(id, options)
    subscribe(id, resource => store.dispatch({ resource, type: update }))
  },
})

interface ResourceMapObject { [key: string]: ResourceReducer }
export let reducers: ResourceMapObject = {}
export const clear = () => { reducers = {} }

export const registerResource = (id: string, options: Source) => {
  // actions
  const update = updateKey(id)
  const consume = consumeKey(id)
  // reducer
  reducers[reducerKey(id)] = (resource = defaultResource, action) => {
    switch (action.type) {
      case update: return action.resource
      case consume: setTimeout(() => callConsume(id, action.props))
      default: return resource
    }
  }
  // building
  register(id, options)
}

export const applyResourceToStore = (store: Store) => {
  Object.keys(reducers).forEach((reducerKey) => {
    const id = /(.*)Resource$/.exec(reducerKey)![1]
    subscribe(id, resource =>
      store.dispatch({ resource, type: updateKey(id) }))
  })
}
