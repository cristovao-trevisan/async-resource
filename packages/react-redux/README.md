# @async-resource/react-redux

## Installation

`npm install --save @async-resource/core @async-resource/redux @async-resource/react-redux`

## Usage
```jsx
import {
  createStore,
  combineReducers,
} from 'redux'
import {
  applyResourceToStore,
  reducers,
  registerResource,
} from '@async-resource/redux'

// -> register your api
registerResource('user', {
  source: () => axios.get('/rest/user-info'),
})
// -> setup an store with your resources
export const store = createStore(combineReducers(reducers))
// -> register store as a resource consumer
applyResourceToStore(store)


// ...

import {
  Resource,
  withResource,
} from '@async-resource/react-redux'

// Use Render Props
const UserInfo = () => (
  <Resource id="user" render={(resource) => {
      if (resource.loading) return <div> Loading </div>
      if (resource.loaded) return <div> Data: { resource.data.name } </div>
      throw new Error('should not get here')
    }}
  />
)

// OR use a HOC
const UserInfo = withResource('error', {
  Loading: () => <div>Loading</div>,
  Loaded: ({ data: { name } }) => <div>{ name }</div>,
  Error: ({ error }) => <div>{ error }</div>,
})

// Or connect with redux yourself :)
```