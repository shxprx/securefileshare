import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('app')).render(
 
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          fontFamily: 'var(--font-family)',
          fontSize: 'var(--font-size-sm)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
        }
      }}
    />
 
)
