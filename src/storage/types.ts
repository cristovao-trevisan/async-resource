export interface GenericStorage {
  set: (key: string, value: any) => Promise<void>
  get: (key: string) => Promise<any | null>
  remove: (key: string) => Promise<void>
}
