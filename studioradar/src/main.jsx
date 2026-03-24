import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import BookStudio from './BookStudio.jsx'
import BeatMarketplace from './BeatMarketplace.jsx'
import ProducerProfiles from './ProducerProfiles.jsx'
import ArtistsGuide from './ArtistsGuide.jsx'
import GlobalAudio from './GlobalAudio.jsx'
import ProducerLogin from './ProducerLogin.jsx'
import ProducerDashboard from './ProducerDashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import CheckoutPage from './CheckoutPage.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <GlobalAudio />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/book-studio" element={<BookStudio />} />
        <Route path="/beats" element={<BeatMarketplace />} />
        <Route path="/producers" element={<ProducerProfiles />} />
        <Route path="/artists" element={<ArtistsGuide />} />
        <Route path="/producer/login" element={<ProducerLogin />} />
        <Route path="/producer/dashboard" element={
          <ProtectedRoute><ProducerDashboard /></ProtectedRoute>
        } />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
