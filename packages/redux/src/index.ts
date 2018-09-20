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
  registerNamespacedResource as registerNamespace,
  consume as callConsume,
  consumeNamespace,
  subscribe,
  subscribeToNamespace,
  defaultResource,
  NamespacedSource,
  NamespaceResource,
} from '@async-resource/core'

export const updateKey = (id: string) => `update-resource-${id}`
export const consumeKey = (id: string) => `consume-resource-${id}`
export const stopKey = (id: string) => `stop-consume-resource-${id}`
export const reducerKey = (id: string) => `${id}Resource`

export const consumeAction = (id: string, props?: ConsumeOptions) => ({ props, type: consumeKey(id) })

type ResourceReducer = Reducer<Resource, AnyAction>
type NamespacedResourceReducer= Reducer<NamespaceResource, AnyAction>

interface NestableReducersMapObject {
  [key: string]: (NestableReducersMapObject | Reducer<any>)
}
interface DynamicStore extends Store {
  attachReducers(reducers: NestableReducersMapObject): void
}

const buildResourceReducer = (id: string): ResourceReducer => {
  const consumers: { [key: string]: Function  } = {}

  const update = updateKey(id)
  const consume = consumeKey(id)
  const stop = stopKey(id)

  return (resource = defaultResource, action) => {
    switch (action.type) {
      case update: return action.resource
      case stop:
        if (consumers[id]) {
          consumers[id]()
          delete consumers[id]
        }
        return resource
      case consume:
        setTimeout(async () => {
          consumers[id] = await callConsume(id, action.props)
        })
      default: return resource
    }
  }
}

const buildNamespacedResourceReducer = (id: string): NamespacedResourceReducer => (namespacedResource = {}, action) => {
  const consumers: { [key: string]: Function  } = {}

  const update = updateKey(id)
  const consume = consumeKey(id)
  const stop = stopKey(id)

  switch (action.type) {
    case update: return action.resource
    case stop:
      const namespaceId = `${id}/${action.namespace}`
      if (consumers[namespaceId]) {
        consumers[namespaceId]()
        delete consumers[namespaceId]
      }
      return namespacedResource
    case consume:
      const { namespace, props } = action
      setTimeout(async () => {
        consumers[`${id}/${namespace}`] = await consumeNamespace(id, namespace, props)
      })
    default: return namespacedResource
  }
}

export default (store: DynamicStore) => ({
  registerResource: (id: string, options: Source) => {
    // reducer
    const reducer = buildResourceReducer(id)
    // building
    const reducerId = reducerKey(id)
    store.attachReducers({ [reducerId]: reducer })
    register(id, options)
    subscribe(id, resource => store.dispatch({ resource, type: updateKey(id) }))
  },
  registerNamespacedResource: (id: string, options: NamespacedSource) => {
    // reducer
    const reducer = buildNamespacedResourceReducer(id)
    // building
    const reducerId = reducerKey(id)
    store.attachReducers({ [reducerId]: reducer })
    registerNamespace(id, options)
    subscribeToNamespace(id, resource => store.dispatch({ resource, type: updateKey(id) }))
  },
})

interface ResourceMapObject { [key: string]: ResourceReducer | NamespacedResourceReducer }
export let reducers: ResourceMapObject = {}
export const clear = () => { reducers = {} }

export const registerResource = (id: string, options: Source) => {
  reducers[reducerKey(id)] = buildResourceReducer(id)
  register(id, options)
}

export const registerNamespacedResource = (id: string, options: NamespacedSource) => {
  reducers[reducerKey(id)] = buildNamespacedResourceReducer(id)
  registerNamespace(id, options)
}

export const applyResourceToStore = (store: Store) => {
  Object.keys(reducers).forEach((reducerKey) => {
    const id = /(.*)Resource$/.exec(reducerKey)![1]
    subscribe(id, resource =>
      store.dispatch({ resource, type: updateKey(id) }))
  })
}
