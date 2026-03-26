import { useState, useEffect, useRef, useCallback } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

// Tiles oscuros gratuitos de CartoDB — sin API key
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const DEFAULT_CENTER = { latitude: 40.4168, longitude: -3.7038, zoom: 11 }

// Pin SVG personalizado
function StudioPin({ selected, hovered }) {
  const size = selected ? 40 : hovered ? 36 : 32
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ transition: 'all 0.15s ease', filter: selected ? 'drop-shadow(0 0 8px #8A2BE2)' : 'none' }}>
      <circle cx="16" cy="16" r="14" fill={selected ? '#8A2BE2' : '#1A1A1A'} stroke="#8A2BE2" strokeWidth="2" />
      {/* Icono de nota musical */}
      <path
        d="M20 9v7.5M20 9l-6 1.5v8M14 18.5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm6-2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"
        stroke={selected ? 'white' : '#8A2BE2'}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

const validStudios = (studios) => studios.filter(s =>
  typeof s.lat === 'number' && typeof s.lng === 'number' &&
  s.lat >= -90 && s.lat <= 90 &&
  s.lng >= -180 && s.lng <= 180
)

export default function StudioMap({ studios = [], selectedStudio, onStudioSelect, onVisibleChange, hoveredStudio }) {
  const safeStudios = validStudios(studios)
  const mapRef = useRef(null)
  const debounceRef = useRef(null)
  const [viewState, setViewState] = useState(DEFAULT_CENTER)
  const [popupStudio, setPopupStudio] = useState(null)
  const [userLocation, setUserLocation] = useState(null)

  // Geolocalización al montar
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        setUserLocation({ latitude, longitude })
        setViewState(v => ({ ...v, latitude, longitude }))
      },
      () => {} // silenciar → queda Madrid por defecto
    )
  }, [])

  // Calcular estudios visibles en el viewport (debounced 400ms)
  const updateVisible = useCallback(() => {
    if (!mapRef.current) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const bounds = mapRef.current.getBounds()
      if (!bounds) return
      const visible = safeStudios.filter(s =>
        s.lat >= bounds.getSouth() &&
        s.lat <= bounds.getNorth() &&
        s.lng >= bounds.getWest() &&
        s.lng <= bounds.getEast()
      )
      onVisibleChange?.(visible)
    }, 400)
  }, [safeStudios, onVisibleChange])

  // Actualizar visibles cuando cambian los estudios o el viewport
  useEffect(() => {
    updateVisible()
    return () => clearTimeout(debounceRef.current)
  }, [updateVisible])

  const handlePinClick = (studio) => {
    setPopupStudio(studio)
    onStudioSelect?.(studio)
  }

  return (
    <>
      {/* CSS global del popup de Mapbox */}
      <style>{`
        .mapboxgl-popup-content {
          background: #1A1A1A !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 12px !important;
          padding: 0 !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6) !important;
          overflow: hidden;
        }
        .mapboxgl-popup-tip { display: none !important; }
        .mapboxgl-popup-close-button {
          color: rgba(255,255,255,0.3) !important;
          font-size: 18px !important;
          padding: 6px 10px !important;
          z-index: 1;
        }
        .mapboxgl-popup-close-button:hover { color: white !important; }
        .mapboxgl-ctrl-group {
          background: #1A1A1A !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
        }
        .mapboxgl-ctrl-group button {
          background: transparent !important;
          color: white !important;
        }
        .mapboxgl-ctrl-icon { filter: invert(1) !important; }
        @keyframes user-pulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(1);   opacity: 0; }
        }
        .user-location-ring {
          animation: user-pulse 2s ease-out infinite;
        }
      `}</style>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={e => { setViewState(e.viewState); updateVisible() }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        reuseMaps
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Marcador de ubicación del usuario */}
        {userLocation && (
          <Marker latitude={userLocation.latitude} longitude={userLocation.longitude} anchor="center">
            <div style={{ position: 'relative', width: 16, height: 16 }}>
              {/* Onda pulsante */}
              <div className="user-location-ring" style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                background: '#3B82F6',
              }} />
              {/* Punto central */}
              <div style={{
                position: 'absolute', inset: '3px',
                borderRadius: '50%',
                background: '#60A5FA',
                border: '2px solid white',
                boxShadow: '0 0 6px rgba(59,130,246,0.8)',
              }} />
            </div>
          </Marker>
        )}

        {/* Pins de estudios */}
        {safeStudios.map(studio => (
          <Marker
            key={studio.id}
            latitude={studio.lat}
            longitude={studio.lng}
            anchor="center"
            onClick={e => { e.originalEvent.stopPropagation(); handlePinClick(studio) }}
          >
            <StudioPin
              selected={selectedStudio?.id === studio.id}
              hovered={hoveredStudio?.id === studio.id}
            />
          </Marker>
        ))}

        {/* Popup al hacer clic en un pin */}
        {popupStudio && (
          <Popup
            latitude={popupStudio.lat}
            longitude={popupStudio.lng}
            anchor="top"
            offset={20}
            onClose={() => setPopupStudio(null)}
            closeOnClick={false}
            maxWidth="220px"
          >
            <div>
              {(popupStudio.photos?.[0] || popupStudio.image_url) && (
                <img
                  src={popupStudio.photos?.[0] ?? popupStudio.image_url}
                  alt={popupStudio.name}
                  loading="lazy"
                  style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }}
                />
              )}
              <div style={{ padding: '12px' }}>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '13px', fontFamily: 'monospace', marginBottom: '2px' }}>
                  {popupStudio.name}
                </p>
                {popupStudio.city && (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontFamily: 'monospace', marginBottom: '6px' }}>
                    {popupStudio.city}
                  </p>
                )}
                {popupStudio.price_per_hour && (
                  <p style={{ color: '#8A2BE2', fontSize: '12px', fontFamily: 'monospace', marginBottom: '10px' }}>
                    Desde {popupStudio.price_per_hour}€/h
                  </p>
                )}
                <button
                  onClick={() => { onStudioSelect?.(popupStudio); setPopupStudio(null) }}
                  style={{
                    width: '100%', background: '#8A2BE2', color: 'white',
                    border: 'none', borderRadius: '8px', padding: '8px',
                    fontSize: '11px', fontFamily: 'monospace', fontWeight: 700,
                    cursor: 'pointer', letterSpacing: '0.05em'
                  }}
                >
                  RESERVAR SESIÓN →
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </>
  )
}
