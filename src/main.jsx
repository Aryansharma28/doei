import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SchuldOverzicht from './schuld/index'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/app" element={<SchuldOverzicht />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
