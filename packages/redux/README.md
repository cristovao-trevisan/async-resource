# @async-resource/redux

## Installation

`npm install --save @async-resource/redux`

## Usage

```js
import connectResource, {
  consumeAction,
  reducers,
  registerResource,
  applyResourceToStore,
} from '@async-resource/redux'

// use it with https://github.com/ioof-holdings/redux-dynamic-reducer
// to add reducers dynamically
export const store = createStore(combineReducers({}))
const { registerResource: registerDynamicResource } = connectResource(store)
registerResource('user', {
  source: () => axios.get('/rest/user-info'),
})


// or use with a constant store
registerResource('user', {
  source: () => axios.get('/rest/user-info'),
})
export const store = createStore(combineReducers(reducers))
applyResourceToStore(store)


// interact with redux
store.dispatch(consumeAction('user'))
```


