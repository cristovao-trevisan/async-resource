import storage from './storage'
import { GenericStorage } from './storage/types'

// interface PaginatedResource {
//   loading: Boolean
//   loaded: Boolean
//   length: Number
//   offset: Number
//   full: Boolean
//   errors: string[]
//   data: Map<Number, any> // index -> data
// }

interface Resource {
  /** True if data was retrieved from cache  */
  cache: boolean
  loading: boolean
  loaded: boolean
  error: string | null
  data: any
}
const defaultResource = {
  cache: false,
  loading: false,
  loaded: false,
  data: null,
  error: null,
}
interface ResourceCache { resource: Resource, timestamp: number }

interface SourceFunctionProps {
  /** User given props */
  props: any,
  /** Current resource value */
  resource: Resource,
}
interface Source {
  source: (options: SourceFunctionProps) => Promise<any>,
  cache?: {
    /** defaults to LocalStorage */
    storage?: GenericStorage,
    /** TODO: maximum data duration */
    TTL?: Number,
  },
}

interface ConsumeOptions {
  /** User given props */
  props?: any,
  reload?: Boolean,
}

type Consumer = (resource: Resource) => void

export class ResourceManager {
  private resources: Map<string, Resource> = new Map()
  private producers: Map<string, Source> = new Map()
  private consumers: Map<string, Consumer[]> = new Map()
  private requests: Map<string, ConsumeOptions> = new Map()
  // private paginatedResources: Map<string, PaginatedResource>

  private updateResource(id: string, resource: Resource) {
    // don't write cache over requested data
    if (this.resources.get(id)!.loaded && resource.cache) return
    // update the state
    this.resources.set(id, resource)
    // consume data
    const consumers = this.consumers.get(id)
    if (consumers) consumers.forEach(consume => consume(resource))
    // cache result (if any)
    const producer = this.producers.get(id)!
    if (!resource.cache && resource.loaded && producer.cache) {
      const store = producer.cache.storage || storage
      store.set(id, { resource, timestamp: Date.now() })
      // set TTL callback
<<<<<<< HEAD
      if (producer.cache.TTL) setTimeout(() => this.consume(id), producer.cache.TTL)
=======
      setTimeout(() => this.consume(id), producer.cache.TTL)
>>>>>>> 975202fa1a2f0ee1b04ac3a69737bf5749877209
    }
  }

  async registerResource(id: string, options: Source) {
    this.producers.set(id, options)
    this.resources.set(id, defaultResource)

    if (options.cache) {
      const store = options.cache.storage || storage
      const data = await store.get(id)
      // ttl logic
      const consumeOptions = this.requests.get(id)
      if (data) {
        const { resource, timestamp } : ResourceCache = data
        const passedTime = Date.now() - timestamp
        if (!options.cache.TTL || passedTime > options.cache!.TTL!) {
          this.updateResource(id, { ...resource, cache: true })
          return
        }
      }
      // defaults to invalid cache
      // (which requests the data if consume was called)
      if (consumeOptions) this.consume(id, consumeOptions)
    }
  }

  registerConsumer(id: string, consumer: Consumer) {
    const consumers = this.consumers.get(id) || []
    consumers.push(consumer)
    this.consumers.set(id, consumers)
  }

  unregisterConsumer(id: string, consumer: Consumer) {
    const consumers = (this.consumers.get(id) || [])
      .filter(item => item !== consumer)
    this.consumers.set(id, consumers)
  }

  async consume(
    id: string,
    consumeOptions: ConsumeOptions = {},
  ) {
    // set as requested
    this.requests.set(id, consumeOptions)
    // read data
    const { reload = false, props } = consumeOptions
    const producer = this.producers.get(id)
    let resource = this.resources.get(id)!

    // test request conditions
    if (!producer || !resource) throw new Error(`Resource not registered: ${id}`)
    if (resource.loading) return // already loading
    if (resource.loaded && !reload) return // already loaded and should not reload

    try {
      // set loading
      resource = { ...resource, loading: true }
      this.updateResource(id, resource)
      // request resource
      const data = await producer.source({ props, resource })
      // got it
      this.updateResource(id, { data, loading: false, loaded: true, error: null, cache: false })
    } catch (e) {
      // failed, set error
      this.updateResource(id, { loading: false, loaded: false, data: null, error: e.message, cache: false })
    }
  }
}

export default new ResourceManager()
