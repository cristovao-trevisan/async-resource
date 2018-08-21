import storage, { GenericStorage } from './storage'

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

  registerResource(id: string, options: Source) {
    this.producers.set(id, options)
    this.resources.set(id, defaultResource)

    if (options.cache) {
      const store = options.cache.storage || storage
      const { resource, timestamp } = store.get(id)
      console.log(timestamp)
      this.resources.set(id, resource)
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
