import React from 'react'
import ReactDOM from 'react-dom/client'
import { App as AppContainer } from './App';

// ========================================================
// Render Setup
// ========================================================
const mountNode = document.getElementById('app')
const root = ReactDOM.createRoot(mountNode)
let render = () => {
  root.render(
    <React.StrictMode>
      <AppContainer />
    </React.StrictMode>
  )
}

// This code is excluded from production bundle
if (process.env.NODE_ENV === 'development') {
  // Development render functions
  const renderApp = render
  const renderError = (error) => {
    const RedBox = require('redbox-react').default
    root.render(<RedBox error={error} />)
  }

  // Wrap render in try/catch
  render = () => {
    try {
      renderApp()
    } catch (error) {
      renderError(error)
    }
  }

  if (module.hot) {
    module.hot.dispose(() => { root.unmount() })
    module.hot.accept()
  }
}

// ========================================================
// Go!
// ========================================================
render()
