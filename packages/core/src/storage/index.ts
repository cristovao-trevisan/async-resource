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
const available = hasLocalStorage()
class LocalStorage implements GenericStorage {
  isAvailable = () => available

  set = async (key: string, value: any) => {
    if (available) localStorage.setItem(key, JSON.stringify(value))
  }

  get = async (key: string) => {
    if (!available) return null
    const item = localStorage.getItem(key)
    return item
      ? JSON.parse(item)
      : null
  }
  remove = async (key: string) => {
    if (available) localStorage.removeItem(key)
  }

  clear = async () => {
    if (available) localStorage.clear()
  }
}

export default new LocalStorage()
