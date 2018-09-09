import { Component } from 'react'
import { connect } from 'react-redux'
import {
  Resource as ResourceType,
  ConsumeOptions,
  consume,
} from '@async-resource/core'
import { reducerKey } from '@async-resource/redux'

import { HOC_LIST } from './propTypes'

interface Props {
  ids: string[]
  render(
    resources: { [key: string]: ResourceType },
    accumulated: {
      loading: boolean,
      error: string | null,
      loaded: boolean,
    },
  ): Component | JSX.Element | null
  resources: any[]
  options?: { [key: string]: ConsumeOptions }
}

class Resources extends Component<Props> {
  static propTypes = HOC_LIST
  static defaultProps = {
    options: {},
  }

  componentWillMount() {
    const { ids, options } = this.props
    setTimeout(() => ids.forEach(id => consume(id, options || {})))
  }

  render() {
    const { render, resources, ids } = this.props
    const loaded = resources.reduce((acc, resource) => acc && resource.loaded, true)
    const error = resources.map(({ error }) => error).find(error => !!error) || null
    const loading = (!loaded && !error) || resources.some(({ loading }) => loading)

    return render(
      resources.reduce(
        (acc, item: ResourceType, index) => ({
          ...acc,
          [ids[index]]: item,
        }),
        {}),
      { loading, loaded, error })
  }
}

const mapStateToProps = (state: any, { ids }: { ids: string[] }) => ({
  resources: ids.map(id => state[reducerKey(id)]),
})

export default connect(mapStateToProps)(Resources)
