import { GenericStorage } from './storage/types'

// export interface PaginatedResource {
//   loading: Boolean
//   loaded: Boolean
//   length: Number
//   offset: Number
//   full: Boolean
//   errors: string[]
//   data: Map<Number, any> // index -> data
// }

export interface Resource {
  /** True if data was retrieved from cache  */
  cache: boolean
  loading: boolean
  loaded: boolean
  error: string | null
  data: any
}

export interface ResourceCache { data: Resource, timestamp: number }

export interface SourceFunctionProps {
  /** User given props */
  props: any,
  /** Current resource value */
  resource: Resource,
}
export interface Source {
  source: (options: SourceFunctionProps) => Promise<any>,
  /** Set for caching */
  cache?: {
    /** Defaults to LocalStorage */
    storage?: GenericStorage,
    /** Maximum data duration */
    TTL?: Number,
  },
}

export interface ConsumeOptions {
  /** User given props */
  props?: any,
  reload?: Boolean,
}

export type Consumer = (resource: Resource) => void
