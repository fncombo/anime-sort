// React
import React from 'react'
import ReactDOM from 'react-dom'

// Components
import App from './js/App'

// Service worker
import * as serviceWorker from './serviceWorker'

// Go!
ReactDOM.render(<App />, document.getElementById('root'))

serviceWorker.register()
