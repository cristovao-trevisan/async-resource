import PropTypes from 'prop-types'

const resource = PropTypes.shape({
  cache: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  updating: PropTypes.bool.isRequired,
  loaded: PropTypes.bool.isRequired,
  error: PropTypes.string,
  data: PropTypes.any,
}).isRequired

export const HOC =  {
  id: PropTypes.string.isRequired,
  render: PropTypes.func.isRequired,
  options: PropTypes.object,
}

export const HOC_LIST =  {
  ids: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  render: PropTypes.func.isRequired,
  options: PropTypes.any,
}

export const renderProps = {
  resource,
}
