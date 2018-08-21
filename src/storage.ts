export interface GenericStorage {
  set: (key: string, value: any) => void
  get: (key: string) => any | undefined
  clear: () => void
}

const hasLocalStorage = () => {
  try {
    localStorage.setItem('hasLocalStorage', 'test')
    localStorage.removeItem('hasLocalStorage')
    return true
  } catch (e) {
    return false
  }
}

export class LocalStorage implements GenericStorage {
  constructor() {
    if (!hasLocalStorage()) throw new Error('Local Storage not available')
  }

  set = (key: string, value: any) => localStorage.setItem(key, JSON.stringify(value))
  get = (key: string) => {
    const item = localStorage.getItem(key)
    return item
      ? JSON.parse(item)
      : null
  }
  clear = () => localStorage.clear()
}

export default new LocalStorage()
