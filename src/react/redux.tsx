import { Component } from 'react'
import { connect } from 'react-redux'
import {
  Resource as ResourceType,
  ConsumeOptions,
} from '../index.types'
import PropTypes from 'prop-types'
import { reducerKey } from '../redux'
import { consume } from '..'

interface Props {
  id: string
  render(resource: ResourceType): Component
  resource: any
  options: ConsumeOptions | null
}

class Resource extends Component<Props> {
  static propTypes = {
    id: PropTypes.string.isRequired,
    render: PropTypes.func.isRequired,
    resource: PropTypes.shape({
      cache: PropTypes.bool.isRequired,
      loading: PropTypes.bool.isRequired,
      loaded: PropTypes.bool.isRequired,
      error: PropTypes.string,
      data: PropTypes.any,
    }).isRequired,
    options: PropTypes.object,
  }

  componentWillMount() {
    const { id, options } = this.props
    consume(id, options || {})
  }

  render() {
    const { render, resource } = this.props
    return render(resource)
  }
}

const mapStateToProps = (state: any, { id }: { id: string }) => ({
  resource: state[reducerKey(id)],
})

export default connect(mapStateToProps)(Resource)
