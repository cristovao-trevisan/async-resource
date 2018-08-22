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
  loading: Boolean
  loaded: Boolean
  error: string | null
  data: any
}
const defaultResource = {
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
  // private paginatedResources: Map<string, PaginatedResource>

  async registerResource(id: string, options: Source) {
    this.producers.set(id, options)
    this.resources.set(id, defaultResource)

    const updateResource = (data: ResourceCache) => {
      const { resource, timestamp } = data
      const passedTime = Date.now() - timestamp
      if (options.cache!.TTL && passedTime > options.cache!.TTL!) return
      // FIXME: do not overwrite correct data
      this.resources.set(id, resource)
    }

    if (options.cache) {
      const store = options.cache.storage || storage
      const data = await store.get(id)
      if (data) updateResource(data)
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
    { reload = false, props }: ConsumeOptions = {},
  ) {
    const producer = this.producers.get(id)!
    let resource = this.resources.get(id)!

    if (!producer || !resource) throw new Error(`Resource not registered: ${id}`)
    if (resource.loading) return // already loading
    if (resource.loaded && !reload) return // already loaded and should not reload

    const updateResource = (newResource: any, success = false) => {
      this.resources.set(id,  { ...resource, ...newResource })
      resource = newResource
      // consume data
      const consumers = this.consumers.get(id)
      if (consumers) consumers.forEach(consume => consume(resource))
      // cache result (if any)
      if (success && producer.cache) {
        const store = producer.cache.storage || storage
        store.set(id, { resource, timestamp: Date.now() })
        // TODO: TTL logic
      }
    }

    try {
      // set loading
      updateResource({ loading: true })
      // request resource
      const data = await producer.source({ props, resource })
      // got it
      updateResource({ data, loading: false, loaded: true, error: null }, true)
    } catch (e) {
      // failed, set error
      updateResource({ loading: false, loaded: false, data: null, error: e.message })
    }
  }
}

export default new ResourceManager()
