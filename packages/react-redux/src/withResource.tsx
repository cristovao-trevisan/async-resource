import React, { Component, ComponentType } from 'react'

import {
  Resource as ResourceType,
  ConsumeOptions,
  consume,
  get,
} from '@async-resource/core'
import { reducerKey } from '@async-resource/redux'
import { connect } from 'react-redux'

interface WithResourceOptions {
  Loading: ComponentType<ResourceType>
  Loaded: ComponentType<ResourceType>
  Error?: ComponentType<ResourceType>
}

interface Props {
  resource: any
}

export default (
  id: string,
  components: WithResourceOptions,
  options?: ConsumeOptions,
) => {
  if (!get(id)) throw new Error(`Resource "${id}" not registered`)
  class Resource extends Component<Props> {
    unsubscribe = () => {}
    componentWillMount() {
      setTimeout(async () => {
        this.unsubscribe = await consume(id, options || {})
      })
    }
    componentWillUnmount() { this.unsubscribe() }

    render() {
      const rawResource: ResourceType = this.props.resource
      const loading = rawResource.loading || ! rawResource.loaded
      const resource = { ...rawResource, loading }
      const { Loading, Loaded, Error } = components

      if (resource.error && Error) return <Error { ...resource } />
      if (loading) return <Loading { ...resource } />
      if (resource.loaded) return <Loaded { ...resource } />
      return null // should never fall here
    }
  }

  const mapStateToProps = (state: any) => ({
    resource: state[reducerKey(id)],
  })

  return connect(mapStateToProps)(Resource)
}
