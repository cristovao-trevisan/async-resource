import PropTypes from 'prop-types'

const resource = PropTypes.shape({
  cache: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  loaded: PropTypes.bool.isRequired,
  error: PropTypes.string,
  data: PropTypes.any,
}).isRequired

export const HOC =  {
  resource,
  id: PropTypes.string.isRequired,
  render: PropTypes.func.isRequired,
  options: PropTypes.object,
}

export const renderProps = {
  resource,
}
