import { GenericStorage } from './storage/types'

// export interface PaginatedResource {
//   readonly loading: Boolean
//   readonly loaded: Boolean
//   readonly length: number
//   readonly offset: number
//   readonly full: Boolean
//   readonly errors: string[]
//   readonly data: Map<number, any> // index -> data
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

export interface NamespaceResource {
  [namespace: string]: Resource
}

export interface ResourceCache { data: Resource, timestamp: number }

export interface SourceFunctionProps {
  /** User given props */
  props: any
  /** Current resource value */
  resource: Resource
}
export interface NamespacedSourceFunctionProps extends SourceFunctionProps {
  namespace: string
  resources: NamespaceResource
}

export interface SourceOptions {
  /** Set for caching */
  cache?: {
    /** Defaults to LocalStorage */
    storage?: GenericStorage,
    /** Maximum data duration */
    TTL?: number,
  },
  /** Used for pooling */
  TTL?: number
}

export interface Source extends SourceOptions {
  source: (options: SourceFunctionProps) => Promise<any>
  update?: (options: SourceFunctionProps) => Promise<any>
}

export interface NamespacedSource extends SourceOptions {
  source: (options: NamespacedSourceFunctionProps) => Promise<any>
}

export interface ConsumeOptions {
  /** User given props */
  props?: any
  reload?: Boolean
}

export type Consumer = (resource: Resource) => void
export type NamespaceConsumer = (resources: NamespaceResource) => void
