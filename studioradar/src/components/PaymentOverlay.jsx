import React, { useEffect, useState } from 'react';
import { Activity, Check, ArrowRight } from 'lucide-react';

const PaymentOverlay = ({ status, onClose, studioName = "Neon Room" }) => {
  if (!status) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/95 backdrop-blur-2xl animate-[fade-in_0.3s_ease-out]">
      <div className="relative w-full max-w-lg p-8 flex flex-col items-center text-center">
        
        {status === 'processing' ? (
          <div className="flex flex-col items-center gap-8">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Helicon Soundwave Logo Animation */}
              <div className="absolute inset-0 bg-accent/20 rounded-full animate-pulse blur-2xl"></div>
              <div className="relative z-10 flex items-center gap-1.5 h-16">
                {[1, 2, 3, 4, 5, 2, 4, 1].map((h, i) => (
                  <div 
                    key={i} 
                    className="w-1.5 bg-accent rounded-full animate-wave"
                    style={{ 
                      height: `${h * 15}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  ></div>
                ))}
              </div>
              <Activity className="absolute -bottom-2 -right-2 w-8 h-8 text-accent animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-heading font-bold text-3xl text-white tracking-tight">Procesando Pago</h2>
              <p className="font-ui text-text/50">Cifrando transacción en la red Helicon...</p>
            </div>
            
            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-accent animate-[loading_3s_ease-in-out]"></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8 animate-[scale-up_0.5s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.4)]">
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            
            <div className="space-y-3">
              <h2 className="font-heading font-bold text-4xl text-white">¡Reserva Confirmada!</h2>
              <p className="font-ui text-text/50 max-w-xs mx-auto">
                Tu sesión en <span className="text-white font-bold">{studioName}</span> está lista. 
                Hemos enviado el boleto digital a tu correo.
              </p>
            </div>

            <button 
              onClick={onClose}
              className="mt-4 flex items-center gap-2 font-ui text-sm uppercase tracking-widest bg-white text-black px-10 py-4 rounded-xl hover:bg-white/90 transition-all font-bold"
            >
              Cerrar y Volver <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.8); }
        }
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes scale-up {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-wave {
          animation: wave 1.2s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default PaymentOverlay;
