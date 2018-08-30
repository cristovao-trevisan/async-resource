# @async-resource

## Motivation
When writing flux-like http stores it's common to repeat lots of boilerplate code to handle, loading, error, caching, parallel requisitions, etc.
This project's objective is to provide a common language on how http flow behaves across an app, plus some very useful functionality, like:

- Caching
- TTL
- Retrying (not implemented yet)
- Isolation, testability, mocking

Works with: redux, vuex, react+redux

# Usage

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

# How it works
The idea is to work in any environment, so the logic is divided in 4 packages

## Core
Always necessary

`npm install --save @async-resource/core`

```js
import {
  registerResource,
  subscribe,
} from '@async-resource/core'

// -> Register resource
registerResource('user', {
  source: () => axios.get('/rest/user-info'),
  cache: { TTL: 24 * 60 * 60 * 1000 } // caches for a day
})

// -> listen for resource change
subscribe('user', resource => {
  // readonly cache: boolean
  // readonly loading: boolean
  // readonly loaded: boolean
  // readonly error: string | null
  // readonly data: any
})

// ...

// -> call resource
resources.consume('user')
```

## Redux

`npm install --save @async-resource/redux`


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

## Vuex

`npm install --save @async-resource/vuex`

```js
import connectResource from '@async-resource/vuex'

// create store
const store = new Store({})
const { registerResource } = connectResource(store)

// register resources dynamically
registerResource('user', {
  source: () => axios.get('/rest/user-info'),
})

// interact with vuex
await store.dispatch('userResource/consume')
```

## React-Redux (works with React-Native)

`npm install --save @async-resource/react-redux`

```js
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
```

# TODOs

- Retrying
- Pagination
- Vue Component with JSX: HOC and Render Props
