import { AsyncStorage } from 'react-native'

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

export class NativeStorage implements GenericStorage {
  set = (key: string, value: any) => AsyncStorage.setItem(key, JSON.stringify(value))
  get = async (key: string) => {
    const item = await AsyncStorage.getItem(key)
    return item
      ? JSON.parse(item)
      : null
  }
  remove = (key: string) => AsyncStorage.removeItem(key)
}

export default new NativeStorage()
