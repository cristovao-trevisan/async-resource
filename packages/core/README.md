# @async-resource/core

## Installation

`npm install --save @async-resource/core`

## Usage

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

