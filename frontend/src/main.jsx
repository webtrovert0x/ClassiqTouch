import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Admin from './Admin.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/booking" element={<App />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/" element={<Navigate to="/booking" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
