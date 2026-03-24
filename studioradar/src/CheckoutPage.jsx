import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, ShoppingCart, Trash2, ShieldCheck, ChevronRight, CheckCircle2 } from 'lucide-react';

const LICENSES = [
  { id: 'basic',     tag: 'MP3 Lease'        },
  { id: 'standard',  tag: 'WAV + Stems'      },
  { id: 'exclusive', tag: 'Derechos Totales' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('helicon_cart') || '[]'); }
    catch { return []; }
  });
  const [isPaying, setIsPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const removeItem = (i) => {
    const next = cart.filter((_, j) => j !== i);
    setCart(next);
    localStorage.setItem('helicon_cart', JSON.stringify(next));
  };

  const total = cart.reduce((s, b) => s + (b.licensePrice || b.price), 0);

  const handlePay = () => {
    setIsPaying(true);
    setTimeout(() => { setPaid(true); localStorage.removeItem('helicon_cart'); }, 2000);
  };

  if (paid) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <div>
          <h1 className="font-heading font-black text-4xl text-white mb-2">¡Pago Completado!</h1>
          <p className="font-ui text-sm text-white/40">Tu licencia ha sido enviada al email. Descarga disponible inmediatamente.</p>
        </div>
        <Link to="/beats" className="font-ui font-bold text-xs uppercase tracking-widest text-accent border border-accent/30 px-6 py-3 rounded-xl hover:bg-accent/10 transition-colors">
          Seguir Explorando Beats
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] font-sans pt-16">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[40vw] h-[40vh] rounded-full blur-[200px] opacity-5" style={{ background: 'rgba(138,43,226,1)' }} />
      </div>

      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-ui text-xs">Volver</span>
          </button>
          <div className="h-4 w-px bg-white/20" />
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Activity className="w-5 h-5 text-accent" />
            <span className="font-heading font-bold text-lg text-white">Helicon</span>
          </Link>
        </div>
        <span className="font-ui text-xs text-white/40 uppercase tracking-widest">Checkout</span>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-heading font-black text-3xl text-white mb-1">Tu Pedido</h1>
          <p className="font-ui text-sm text-white/40">{cart.length} {cart.length === 1 ? 'beat' : 'beats'} · Descarga inmediata tras el pago</p>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/20">
            <ShoppingCart className="w-12 h-12 mb-4" />
            <p className="font-ui text-sm">El carrito está vacío</p>
            <Link to="/beats" className="mt-6 font-ui text-xs text-accent hover:underline">Explorar beats</Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-8">
              {cart.map((item, i) => {
                const [r, g, b] = item.colors[0];
                const lic = LICENSES.find(l => l.id === (item.licenseId || 'basic'));
                return (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                    <img src={item.image} alt={item.title} className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-base text-white truncate">{item.title}</p>
                      <p className="font-ui text-xs text-white/40 mb-2">{item.producer}</p>
                      <span className="font-ui text-[10px] px-2.5 py-1 rounded-full border inline-block" style={{ borderColor:`rgba(${r},${g},${b},0.4)`, color:`rgb(${r},${g},${b})`, background:`rgba(${r},${g},${b},0.08)` }}>
                        {lic?.tag || 'MP3 Lease'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="font-heading font-bold text-lg text-white">{item.licensePrice || item.price}€</span>
                      <button onClick={() => removeItem(i)} className="text-white/20 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="font-ui text-sm text-white/50">Subtotal</span>
                <span className="font-heading font-bold text-white">{total}€</span>
              </div>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                <span className="font-ui text-sm text-white/50">IVA (21%)</span>
                <span className="font-heading font-bold text-white">{Math.round(total * 0.21)}€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-heading font-bold text-lg text-white">Total</span>
                <span className="font-heading font-black text-3xl text-white">{Math.round(total * 1.21)}€</span>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={isPaying}
              className="w-full py-5 rounded-2xl font-ui font-bold text-sm uppercase tracking-widest text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #8A2BE2 0%, #6A1BE2 100%)', boxShadow: '0 0 40px rgba(138,43,226,0.4)' }}
            >
              {isPaying ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando pago...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Pagar {Math.round(total * 1.21)}€ con Stripe <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="font-ui text-[10px] text-white/20 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> SSL encriptado</span>
              <span className="text-white/10">·</span>
              <span className="font-ui text-[10px] text-white/20">Powered by Stripe</span>
              <span className="text-white/10">·</span>
              <span className="font-ui text-[10px] text-white/20">Descarga inmediata</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
