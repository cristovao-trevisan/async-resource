import { AsyncStorage } from 'react-native'

import { GenericStorage } from './types'

class NativeStorage implements GenericStorage {
  set = (key: string, value: any) => AsyncStorage.setItem(key, JSON.stringify(value))
  get = async (key: string) => {
    const item = await AsyncStorage.getItem(key)
    return item
      ? JSON.parse(item)
      : null
  }
  remove = (key: string) => AsyncStorage.removeItem(key)

  clear = () => AsyncStorage.clear()
}

export default new NativeStorage()
