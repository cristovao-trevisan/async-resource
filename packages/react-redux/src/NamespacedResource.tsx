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

import { HOC } from './propTypes'

interface Props {
  id: string
  namespace: string
  render(resource: ResourceType, completeResource: NamespaceResourceType): Component | JSX.Element | null
  resource: any
  options?: ConsumeOptions | null
}

class NamespacedResource extends Component<Props> {
  static propTypes = HOC

  unsubscribe = () => {}
  componentWillMount() {
    const { id, options, namespace } = this.props
    setTimeout(async () => {
      this.unsubscribe = await consumeNamespace(id, namespace, options || {})
    })
  }
  componentWillUnmount() { this.unsubscribe() }
  async componentDidUpdate(prevProps: Props) {
    const { id, namespace, options } = this.props
    if (prevProps.namespace !== namespace) {
      this.unsubscribe()
      this.unsubscribe = await consumeNamespace(id, namespace, options || {})
    }
  }

  render() {
    const { render, resource, namespace } = this.props
    const namespaceResource = (resource[namespace] || defaultResource) as ResourceType
    const loading: boolean = namespaceResource.loading || !namespaceResource.loaded

    return render({ ...namespaceResource, loading }, resource)
  }
}

const mapStateToProps = (state: any, { id, namespace }: { id: string, namespace: string }) => ({
  resource: state[reducerKey(id)],
})

export default connect(mapStateToProps)(NamespacedResource)
