import { useRef } from 'react';
import { useLocation } from 'react-router-dom';

const SILENT_PAGES = ['/beats', '/perfil'];

export default function GlobalAudio() {
  const audioRef = useRef(null);
  const location = useLocation();

  if (SILENT_PAGES.includes(location.pathname)) return null;

  return <audio ref={audioRef} src="/bg-audio.wav" loop style={{ display: 'none' }} />;
}
