import { GenericStorage } from './types'

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

  set = async (key: string, value: any) => localStorage.setItem(key, JSON.stringify(value))
  get = async (key: string) => {
    const item = localStorage.getItem(key)
    return item
      ? JSON.parse(item)
      : null
  }
  remove = async (key: string) => localStorage.removeItem(key)
}

export default new LocalStorage()
