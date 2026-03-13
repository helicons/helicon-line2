import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import BookStudio from './BookStudio.jsx'
import GlobalAudio from './GlobalAudio.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <GlobalAudio />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/book-studio" element={<BookStudio />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
