import { Component } from 'react'
import { connect } from 'react-redux'
import {
  Resource as ResourceType,
  ConsumeOptions,
  consume,
} from '@async-resource/core'
import { reducerKey } from '@async-resource/redux'

import { HOC } from './propTypes'

interface Props {
  id: string
  render(resource: ResourceType): Component | JSX.Element
  resource: any
  options?: ConsumeOptions | null
}

class Resource extends Component<Props> {
  static propTypes = HOC

  componentWillMount() {
    const { id, options } = this.props
    setTimeout(() => consume(id, options || {}))
  }

  render() {
    const { render, resource } = this.props
    const loading: boolean = resource.loading || !resource.loaded
    return render({ ...resource, loading })
  }
}

const mapStateToProps = (state: any, { id }: { id: string }) => ({
  resource: state[reducerKey(id)],
})

export default connect(mapStateToProps)(Resource)
