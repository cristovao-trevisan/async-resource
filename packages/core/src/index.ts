import storage from './storage'
import {
  Resource,
  Source,
  ConsumeOptions,
  Consumer,
  ResourceCache,
  SourceOptions,
  // PaginatedSource,
  // PaginatedResource,
} from './index.types'

export * from './index.types'

export const defaultResource: Resource = {
  cache: false,
  loading: false,
  updating: false,
  loaded: false,
  data: null,
  error: null,
}

const resources: Map<string, Resource> = new Map()
const producers: Map<string, Source> = new Map()
const consumersMap: Map<string, Consumer[]> = new Map()
const requests: Map<string, ConsumeOptions> = new Map()
// const paginatedResources: Map<string, PaginatedResource> = new Map()

const updateResource = (id: string, resource: Resource) => {
  // don't write cache over requested data
  if (resources.get(id)!.loaded && resource.cache) return
  // update the state
  resources.set(id, resource)
  // consume data
  const consumers = consumersMap.get(id)
  if (consumers) consumers.forEach(consume => consume(resource))
  // cache result (if any)
  const producer = producers.get(id)!
  if (!resource.cache && resource.loaded && producer.cache) {
    const store = producer.cache.storage || storage
    store.set(`${id}Resource`, { data: resource.data, timestamp: Date.now() })
    // set TTL callback
    if (producer.cache.TTL) {
      setTimeout(
        () => {
          const options = requests.get(id) || {}
          consume(id, { ...options, reload: true })
        },
        producer.cache.TTL)
    }
  }
}

/**
 * Try to read cache and update resource,
 * return true if data was found and set
 */
const readCache = async (id: string, options: SourceOptions) => {
  updateResource(id, { ...defaultResource, loading: true, cache: true })
  const cache = options.cache!
  const store = cache.storage || storage
  const storageItem: ResourceCache = await store.get(`${id}Resource`)
  // cache logic
  if (storageItem) {
    const { data, timestamp } = storageItem
    const passedTime = Date.now() - timestamp
    if (!cache.TTL || passedTime > options.cache!.TTL!) {
      updateResource(id, { ...defaultResource, data, loaded: true, cache: true })
      return true
    }
  }
  updateResource(id, defaultResource)
  return false
}

export const registerResource = async (id: string, options: Source) => {
  producers.set(id, options)
  resources.set(id, defaultResource)

  if (options.cache) {
    const cacheHit = await readCache(id, options)
    // defaults to invalid cache
    // (which requests the data if consume was called)
    const consumeOptions = requests.get(id)
    if (!cacheHit && consumeOptions) await consume(id, consumeOptions)
  }
}

// export const registerPaginatedResource = async (id: string, options: PaginatedSource) => {
// }

/** Returns an unsubscribe function */
export const subscribe = (id: string, consumer: Consumer) => {
  const consumers = consumersMap.get(id) || []
  consumers.push(consumer)
  consumersMap.set(id, consumers)
  const resource = resources.get(id)
  if (resource) consumer(resource)

  return () => unsubscribe(id, consumer)
}

export const unsubscribe = (id: string, consumer: Consumer) => {
  const consumers = (consumersMap.get(id) || [])
    .filter(item => item !== consumer)
  consumersMap.set(id, consumers)
}

export const consume = async (
  id: string,
  consumeOptions: ConsumeOptions = {},
) => {
  // set as requested
  requests.set(id, consumeOptions)
  // read data
  const { reload = false, props } = consumeOptions
  const producer = producers.get(id)
  const resource = resources.get(id)!

  // test request conditions
  if (!producer || !resource) throw new Error(`Resource not registered: ${id}`)
  if (resource.loading) return // already loading
  if (resource.loaded && !reload) return // already loaded and should not reload

  try {
    // set loading
    updateResource(id, { ...resource, loading: true })
    // request resource
    const data = await producer.source({ props, resource })
    // got it
    updateResource(id, { ...defaultResource, data, loaded: true, updating: false })
  } catch (e) {
    // failed, set error
    updateResource(id, { ...defaultResource, error: e.message })
  }
}

export const update = async (
  id: string,
  props: any,
) => {
  // read data
  const producer = producers.get(id)
  const resource = resources.get(id)

  // test request conditions
  if (!producer || !resource) throw new Error(`Resource not registered: ${id}`)
  if (!producer.update) throw new Error(`Update not registered for resource: ${id}`)
  if (resource.updating) return // already updating

  // set as updating
  updateResource(id, { ...resource, updating: true })
  try {
    // try to update
    const data = await producer.update({ resource, props })
    // got it
    updateResource(id, { ...resource, data, updating: false })
  } catch (err) {
    // ops, return to original state and throw
    updateResource(id, resource)
    throw err
  }
}

export const get = (id: string) => resources.get(id)

export const clear = () => {
  resources.clear()
  producers.clear()
  consumersMap.clear()
  requests.clear()
}
