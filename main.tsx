import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // This import was causing the error because the file was missing

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)