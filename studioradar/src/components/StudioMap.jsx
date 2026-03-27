import { useState, useEffect, useRef, useCallback } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

const MAP_STYLE   = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const DEFAULT_CENTER = { latitude: 40.4168, longitude: -3.7038, zoom: 11 }

// Pin con efecto radar pulsante
function StudioPin({ selected, hovered }) {
  const size = selected ? 44 : hovered ? 38 : 32
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Anillo radar — siempre visible, más pronunciado si seleccionado */}
      <div
        className={selected ? 'pin-radar-selected' : 'pin-radar'}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: selected ? '#8A2BE2' : 'rgba(138,43,226,0.5)',
        }}
      />
      {/* Segundo anillo más lento si seleccionado */}
      {selected && (
        <div className="pin-radar-selected-2" style={{
          position: 'absolute',
          inset: '-6px',
          borderRadius: '50%',
          border: '2px solid rgba(138,43,226,0.6)',
        }} />
      )}
      {/* Pin SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        style={{
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.2s ease',
          filter: selected
            ? 'drop-shadow(0 0 10px #8A2BE2) drop-shadow(0 0 4px #fff)'
            : hovered ? 'drop-shadow(0 0 6px #8A2BE2)' : 'none',
        }}
      >
        <circle cx="16" cy="16" r="14"
          fill={selected ? '#8A2BE2' : '#0D0D0D'}
          stroke={selected ? '#C084FC' : '#8A2BE2'}
          strokeWidth={selected ? 2.5 : 1.5}
        />
        <path
          d="M20 9v7.5M20 9l-6 1.5v8M14 18.5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm6-2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"
          stroke={selected ? 'white' : '#8A2BE2'}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  )
}

// Card del estudio reutilizada en popup (desktop) y bottom sheet (móvil)
function StudioCard({ studio, onSelect, onClose }) {
  return (
    <div style={{ fontFamily: 'monospace' }}>
      {(studio.photos?.[0] || studio.image_url) ? (
        <div style={{ position: 'relative' }}>
          <img
            src={studio.photos?.[0] ?? studio.image_url}
            alt={studio.name}
            loading="lazy"
            style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }}
          />
          {/* Gradiente sobre imagen */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
            background: 'linear-gradient(transparent, #0D0D0D)',
          }} />
        </div>
      ) : (
        /* Placeholder sin foto */
        <div style={{
          height: '80px', background: 'linear-gradient(135deg, #1A0A2E 0%, #0D0D0D 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M20 9v7.5M20 9l-6 1.5v8M14 18.5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm6-2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"
              stroke="#8A2BE2" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}

      <div style={{ padding: '14px' }}>
        {/* Nombre */}
        <p style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '4px', letterSpacing: '-0.01em' }}>
          {studio.name}
        </p>

        {/* Ciudad */}
        {studio.city && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '8px' }}>
            📍 {studio.city}
          </p>
        )}

        {/* Tags de equipo */}
        {studio.equipment_tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
            {studio.equipment_tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                background: 'rgba(138,43,226,0.15)',
                border: '1px solid rgba(138,43,226,0.3)',
                color: '#C084FC',
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '4px',
                letterSpacing: '0.05em',
              }}>{tag}</span>
            ))}
          </div>
        )}

        {/* Precio */}
        {studio.price_per_hour && (
          <p style={{ color: '#A855F7', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
            Desde <span style={{ color: '#C084FC' }}>{studio.price_per_hour}€</span>/h
          </p>
        )}

        <button
          onClick={() => { onSelect?.(studio); onClose?.() }}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #7C3AED, #8A2BE2)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.08em',
            transition: 'opacity 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          RESERVAR SESIÓN →
        </button>
      </div>
    </div>
  )
}

const validStudios = (studios) => studios.filter(s =>
  typeof s.lat === 'number' && typeof s.lng === 'number' &&
  s.lat >= -90 && s.lat <= 90 && s.lng >= -180 && s.lng <= 180
)

export default function StudioMap({ studios = [], selectedStudio, onStudioSelect, onVisibleChange, hoveredStudio }) {
  const safeStudios  = validStudios(studios)
  const mapRef       = useRef(null)
  const debounceRef  = useRef(null)
  const [viewState, setViewState]     = useState(DEFAULT_CENTER)
  const [popupStudio, setPopupStudio] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const isMobile = window.innerWidth < 768

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        setUserLocation({ latitude, longitude })
        setViewState(v => ({ ...v, latitude, longitude }))
      },
      () => {}
    )
  }, [])

  const updateVisible = useCallback(() => {
    if (!mapRef.current) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const bounds = mapRef.current.getBounds()
      if (!bounds) return
      const visible = safeStudios.filter(s =>
        s.lat >= bounds.getSouth() && s.lat <= bounds.getNorth() &&
        s.lng >= bounds.getWest() && s.lng <= bounds.getEast()
      )
      onVisibleChange?.(visible)
    }, 400)
  }, [safeStudios, onVisibleChange])

  useEffect(() => {
    updateVisible()
    return () => clearTimeout(debounceRef.current)
  }, [updateVisible])

  const handlePinClick = (studio) => {
    setPopupStudio(studio)
    onStudioSelect?.(studio)
  }

  const closePopup = () => setPopupStudio(null)

  return (
    <>
      <style>{`
        /* Animaciones radar de pines */
        @keyframes pin-radar {
          0%   { transform: scale(1);   opacity: 0.5; }
          70%  { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(1);   opacity: 0; }
        }
        @keyframes pin-radar-sel {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(2.8); opacity: 0; }
          100% { transform: scale(1);   opacity: 0; }
        }
        @keyframes pin-radar-ring {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .pin-radar          { animation: pin-radar      3s ease-out infinite; }
        .pin-radar-selected { animation: pin-radar-sel  1.6s ease-out infinite; }
        .pin-radar-selected-2 { animation: pin-radar-ring 1.6s ease-out 0.4s infinite; }

        /* Animación usuario */
        @keyframes user-pulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(1);   opacity: 0; }
        }
        .user-location-ring { animation: user-pulse 2s ease-out infinite; }

        /* Popup desktop — maplibre usa prefijo maplibregl */
        .maplibregl-popup-content {
          background: #0D0D0D !important;
          border: 1px solid rgba(138,43,226,0.25) !important;
          border-radius: 14px !important;
          padding: 0 !important;
          box-shadow: 0 0 0 1px rgba(138,43,226,0.1), 0 24px 60px rgba(0,0,0,0.8) !important;
          overflow: hidden;
          min-width: 220px;
        }
        .maplibregl-popup-tip { display: none !important; }
        .maplibregl-popup-close-button {
          color: rgba(255,255,255,0.3) !important;
          font-size: 18px !important;
          padding: 6px 10px !important;
          z-index: 2;
          background: rgba(0,0,0,0.4) !important;
          border-radius: 0 14px 0 8px !important;
        }
        .maplibregl-popup-close-button:hover { color: white !important; background: rgba(138,43,226,0.4) !important; }
        .maplibregl-ctrl-group {
          background: #0D0D0D !important;
          border: 1px solid rgba(138,43,226,0.2) !important;
        }
        .maplibregl-ctrl-group button { background: transparent !important; color: white !important; }
        .maplibregl-ctrl-icon { filter: invert(1) !important; }

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

        {/* Marcador ubicación usuario */}
        {userLocation && (
          <Marker latitude={userLocation.latitude} longitude={userLocation.longitude} anchor="center">
            <div style={{ position: 'relative', width: 16, height: 16 }}>
              <div className="user-location-ring" style={{
                position: 'absolute', inset: 0, borderRadius: '50%', background: '#8A2BE2',
              }} />
              <div style={{
                position: 'absolute', inset: '3px', borderRadius: '50%',
                background: '#A855F7', border: '2px solid white',
                boxShadow: '0 0 6px rgba(138,43,226,0.8)',
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

        {/* Popup desktop (oculto en móvil) */}
        {popupStudio && !isMobile && (
          <Popup
            latitude={popupStudio.lat}
            longitude={popupStudio.lng}
            anchor="top"
            offset={24}
            onClose={closePopup}
            closeOnClick={false}
            maxWidth="240px"
          >
            <StudioCard studio={popupStudio} onSelect={onStudioSelect} onClose={closePopup} />
          </Popup>
        )}
      </Map>

    </>
  )
}
