import {
  registerResource,
  consume,
  get,
  subscribe,
} from './resource'
import {
  NamespacedSource,
  ConsumeOptions,
  NamespaceConsumer,
  NamespaceResource,
  NamespacedSourceFunctionProps,
} from './types'

const namespaceIdentifier = (id: string, namespace: string) => `${id}/${namespace}`

const namespacedResources: Map<string, { [namespace: string]: boolean }> = new Map()
const namespacedSources: Map<string, NamespacedSource> = new Map()
const consumersMap: Map<string, NamespaceConsumer[]> = new Map()
const namespacedSubscriptions: Map<string, Function[]> = new Map()

export const registerNamespacedResource = (
  id: string, source: NamespacedSource,
) => {
  namespacedResources.set(id, {})
  namespacedSources.set(id, source)
}

const onResource = (id: string) => () => {
  const consumers = consumersMap.get(id)!
  const data = getResourceData(id)
  consumers.forEach(consumer => consumer(data))
}

const getResourceData = (id: string): NamespaceResource => {
  const resource = namespacedResources.get(id)!
  const namespaces = Object.keys(resource)

  return namespaces.reduce(
    (acc, namespace) => ({ ...acc, [namespace]: get(namespaceIdentifier(id, namespace)) }),
    {})
}

export const consumeNamespace = async (
  id: string, namespace: string,
  options: ConsumeOptions = {},
) => {
  const resource = namespacedResources.get(id)
  const source = namespacedSources.get(id)!

  if (!resource || !source) throw new Error(`Resource not registered, id: ${id}`)
  const hasNamespace = resource[namespace]
  const namespaceId = namespaceIdentifier(id, namespace)

  if (!hasNamespace) {
    // register new resource for new namespace
    const { source: namespacedSource, ...props } = source
    await registerResource(namespaceId, {
      ...props,
      // do some transformations to aggregate resources
      source: ({ props, resource }) => namespacedSource({
        resource, props, namespace,
        resources: getResourceData(id),
      }),
    })
    namespacedResources.set(id, { ...resource, [namespace]: true })
    // subscribe for changes
    const unsubscribe = subscribe(namespaceId, onResource(id))
    const subscriptions = namespacedSubscriptions.get(id) || []
    subscriptions.push(unsubscribe)
    namespacedSubscriptions.set(id, subscriptions)
  }

  return consume(namespaceId, options)
}

export const unsubscribeFromNamespace = (id: string, consumer: NamespaceConsumer) => {
  const consumers = (consumersMap.get(id) || [])
    .filter(item => item !== consumer)
  consumersMap.set(id, consumers)
}

/** Returns an unsubscribe function */
export const subscribeToNamespace = (
  id: string, consumer: NamespaceConsumer,
) => {
  const resource = namespacedResources.get(id)
  if (!resource) throw new Error(`Resource not registered, id: ${id}`)

  const consumers = consumersMap.get(id) || []
  consumers.push(consumer)
  consumersMap.set(id, consumers)

  const hasAnyNamespace = Object.keys(resource).length > 0
  if (hasAnyNamespace) consumer(getResourceData(id))

  return () => unsubscribeFromNamespace(id, consumer)
}

export const getFromNamespace = (id: string) => namespacedResources.get(id)

export const clearNamespacedResources = () => {
  namespacedResources.clear()
  namespacedSources.clear()
  consumersMap.clear()
  namespacedSubscriptions.clear()
}
