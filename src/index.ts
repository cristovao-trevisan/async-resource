// interface PaginatedResource {
//   loading: Boolean
//   loaded: Boolean
//   length: Number
//   offset: Number
//   full: Boolean
//   errors: String[]
//   data: Map<Number, any> // index -> data
// }

interface Resource {
  loading: Boolean
  loaded: Boolean
  error: String | null
  data: any
}
type SourceFunctionProps = {
  /** User given props ... */
  props: any,
  /** Current resource value ... */
  resource: Resource,
}
interface Source {
  source: (options: SourceFunctionProps) => Promise<any>
}

export class ResourceManager {
  private resources: Map<String, Resource> = new Map()
  private producers: Map<String, Source> = new Map()
  // private paginatedResources: Map<String, PaginatedResource>

  registerResource(id: String, options: Source) {
    this.producers.set(id, options)
    this.resources.set(id, {
      loading: false,
      loaded: false,
      data: null,
      error: null,
    })
  }

  async consume(id: String, props?: any) {
    const producer = this.producers.get(id)
    let resource = this.resources.get(id)

    if (!producer || !resource) throw new Error(`Resource not registered: ${id}`)
    if (resource.loaded) return // already loaded
    if (resource.loading) return // already loading

    const updateResource = (newResource: any) => {
      this.resources.set(id,  { ...resource, ...newResource })
      resource = newResource
      console.log(resource)
      // TODO: cache, call consumers
    }

    // TODO: reload logic
    try {
      // set loading
      updateResource({ loading: true })
      // request resource
      const data = await producer.source({ props, resource })
      // got it
      updateResource({ data, loading: false, loaded: true, error: null })
    } catch (e) {
      // failed, set error
      updateResource({ loading: false, loaded: false, data: null, error: e.message })
    }
  }
}

export default new ResourceManager()
