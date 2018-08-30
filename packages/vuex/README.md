# @async-resource/redux

## Installation

`npm install --save @async-resource/vuex`

## Usage

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


