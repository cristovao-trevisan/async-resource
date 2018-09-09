import { GenericStorage } from './storage/types'

// export interface PaginatedResource {
//   readonly loading: Boolean
//   readonly loaded: Boolean
//   readonly length: Number
//   readonly offset: Number
//   readonly full: Boolean
//   readonly errors: string[]
//   readonly data: Map<Number, any> // index -> data
// }

export interface Resource {
  /** True if data was retrieved from cache  */
  readonly cache: boolean
  readonly loading: boolean
  readonly updating: boolean
  readonly loaded: boolean
  readonly error: string | null
  readonly data: any
}

export interface ResourceCache { data: Resource, timestamp: number }

export interface SourceFunctionProps {
  /** User given props */
  props: any,
  /** Current resource value */
  resource: Resource,
}

export interface SourceOptions {
  /** Set for caching */
  cache?: {
    /** Defaults to LocalStorage */
    storage?: GenericStorage,
    /** Maximum data duration */
    TTL?: Number,
  },
  /** Used for pooling */
  TTL?: Number,
}

export interface Source extends SourceOptions {
  source: (options: SourceFunctionProps) => Promise<any>,
  update?: (options: SourceFunctionProps) => Promise<any>
}

// export interface PaginatedSourceFunctionProps {
//   /** User given props */
//   props: any,
//   /** Current resource value */
//   resource: PaginatedResource,
// }

// export interface PaginatedSource extends SourceOptions {
//   source: (options: PaginatedSourceFunctionProps) => Promise<any>,
// }

export interface ConsumeOptions {
  /** User given props */
  props?: any,
  reload?: Boolean,
}

export type Consumer = (resource: Resource) => void
