import { Component } from 'react'
import { connect } from 'react-redux'
import {
  Resource as ResourceType,
  NamespaceResource as NamespaceResourceType,
  ConsumeOptions,
  consumeNamespace,
  defaultResource,
} from '@async-resource/core'
import { reducerKey } from '@async-resource/redux'

import { HOC_LIST } from './propTypes'

interface Props {
  ids: string[]
  namespace: string
  render(
    resources: { [key: string]: ResourceType },
    accumulated: {
      loading: boolean,
      error: string | null,
      loaded: boolean,
    },
    completeResources: NamespaceResourceType,
  ): Component | JSX.Element | null
  resources: NamespaceResourceType[]
  options?: { [key: string]: ConsumeOptions }
}

class NamespacedResources extends Component<Props> {
  static propTypes = HOC_LIST
  static defaultProps = { options: {} }
  unsubscribes: (() => void)[] = []

  unsubscribe = () => {}
  componentWillMount() {
    const { ids, options = {}, namespace } = this.props
    setTimeout(() => ids.forEach(async id => this.unsubscribes.push(
      await consumeNamespace(id, namespace, options[id] || {})),
    ))
  }
  componentWillUnmount() {
    this.unsubscribes.forEach(unsubscribe => unsubscribe())
  }
  async componentDidUpdate(prevProps: Props) {
    const { ids, namespace, options = {} } = this.props
    if (prevProps.namespace !== namespace) {
      this.unsubscribes.forEach(unsubscribe => unsubscribe())
      this.unsubscribes = []
      console.log('UPDATE AOSIJDLK AJSOD IJAOIS JLKD')
      ids.forEach(async id => this.unsubscribes.push(
        await consumeNamespace(id, namespace, options[id] || {})),
      )
    }
  }

  render() {
    const { render, namespace, ids } = this.props
    const resources = this.props.resources as NamespaceResourceType[]
    const namespacedResources = resources.map(resource => resource[namespace] || defaultResource)

    // calc acc flags
    const loaded = !namespacedResources.some(resource => !resource.loaded)
    const error = namespacedResources.map(resource => resource.error).find(error => !!error) || null
    const loading = (!loaded && !error) || namespacedResources.some(resource => resource.loading)

    return render(
      namespacedResources.reduce((acc, resource, index) => ({ ...acc, [ids[index]]: resource }), {}),
      { loaded, error, loading },
      resources.reduce((acc, resource, index) => ({ ...acc, [ids[index]]: resource }), {}),
    )
  }
}

const mapStateToProps = (state: any, { ids }: { ids: string[] }) => ({
  resources: ids.map(id => state[reducerKey(id)]) as NamespaceResourceType[],
})

export default connect(mapStateToProps)(NamespacedResources)
