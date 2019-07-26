# @async-resource/svelte

## Installation

`npm install --save @async-resource/core @async-resource/svelte`

## Usage

### Simple resource

```js
// resources.js
import { registerResource } from '@async-resource/svelte'

export const usersResource = registerResource('users', {
  source: async () => {
    const res = await fetch('https://jsonplaceholder.typicode.com/users')
    return res.json()
  },
  // TTL: 3000, // polling (every 3 seconds)
  // cache: {} // caches to local storage
})
```

```html
<script>
  import { useResource } from '@async-resource/svelte'
  import { usersResource } from '../resources'

  const users = useResource(usersResource, {})
</script>

{#if $users.loading}
  Loading users...
{:else if $users.loaded}
  # of users: {$users.data.length}
{:else}
  Error: {$users.error}
{/if}
```

### Namespaced Resource

```js
// resources.js
import { registerNamespacedResource } from '@async-resource/svelte'

export const userResource = registerNamespacedResource('user', {
  source: async ({ namespace }) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${namespace}`)
    return res.json()
  },
})
```

```html
<script>
  import { useNamespacedResource } from '@async-resource/svelte'
  import { userResource } from '../resources'

  const user = useNamespacedResource(userResource, 1, {})
</script>

{#if $user.resource.loading}
  Loading user...
{:else if $user.resource.loaded}
  Username: {$user.resource.data.username}
{:else}
  Error: {$user.resource.error}
{/if}
```
