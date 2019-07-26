import { writable } from 'svelte/store'
import {
  Resource,
  defaultResource,
  registerResource as register,
  Source,
  subscribe,
  consume,
  ConsumeOptions,
  clear as clearResources,

  NamespaceResource,
  registerNamespacedResource as registerNamespace,
  subscribeToNamespace,
  consumeNamespace,
  NamespacedSource,
  clearNamespacedResources,
} from '@async-resource/core'

const sources = new Map<string, Source>()
export const registerResource = (id: string, source: Source) => {
  sources.set(id, source)
  register(id, source)

  return id
}

export const useResource = (id: string, opts: ConsumeOptions) => {
  const source = sources.get(id)
  if (!source) throw new Error(`Resource '${id}' not registered`)

  const store = writable(defaultResource, () => {
    const unsubscribePromise = consume(id, opts)
    return () => {
      unsubscribe()
      unsubscribePromise.then(uns => uns())
    }
  })
  var unsubscribe = subscribe(id, store.set)

  return store
}

const namespacedSources = new Map<string, NamespacedSource>()
export const registerNamespacedResource = (id: string, source: NamespacedSource) => {
  namespacedSources.set(id, source)
  registerNamespace(id, source)

  return id
}

export interface NamespacedResourceStoreValue {
  resource: Resource
  resources: NamespaceResource
}
export const useNamespacedResource = (id: string, namespace: string, opts: ConsumeOptions) => {
  const source = namespacedSources.get(id)
  if (!source) throw new Error(`Namespaced resource '${id}' not registered`)

  const store = writable<NamespacedResourceStoreValue>({ resource: defaultResource, resources: {} }, () => {
    const unsubscribePromise = consumeNamespace(id, namespace, opts)
    return () => {
      unsubscribe()
      unsubscribePromise.then(uns => uns())
    }
  })
  var unsubscribe = subscribeToNamespace(id, (resources) => {
    const resource = resources[namespace] || defaultResource
    store.set({ resource, resources })
  })

  return store
}

export const clear = () => {
  sources.clear()
  namespacedSources.clear()
  clearResources()
  clearNamespacedResources()
}
