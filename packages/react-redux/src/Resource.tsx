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
  render(resource: ResourceType): Component | JSX.Element | null
  resource: any
  options?: ConsumeOptions | null
}

class Resource extends Component<Props> {
  static propTypes = HOC

  unsubscribe = () => {}
  componentWillMount() {
    const { id, options } = this.props
    setTimeout(async () => {
      this.unsubscribe = await consume(id, options || {})
    })
  }
  componentWillUnmount() { this.unsubscribe() }

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
