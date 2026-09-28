import { useState, useEffect } from 'react';
import { Lock, Delete, X } from 'lucide-react';

interface PinModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const PIN_KEY = 'cocina-campamento-pin';
const DEFAULT_PIN = '1234';

function getPinGuardado(): string {
  try {
    return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
  } catch {
    return DEFAULT_PIN;
  }
}

export function PinModal({ onSuccess, onCancel }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const pinCorrecto = getPinGuardado();

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === pinCorrecto) {
        setTimeout(() => onSuccess(), 150);
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 600);
      }
    }
  }, [pin, pinCorrecto, onSuccess]);

  const handleNumber = (num: string) => {
    if (pin.length < 4) setPin(pin + num);
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-stone-900">Acceso restringido</h2>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-stone-100 rounded-full">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <p className="text-sm text-stone-600 mb-4">Introduce el PIN de 4 dígitos para acceder a la gestión de proveedores.</p>

        {/* Indicadores de dígitos */}
        <div className={`flex justify-center gap-3 mb-6 ${error ? 'animate-pulse' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                error
                  ? 'bg-red-500'
                  : i < pin.length
                  ? 'bg-orange-600 scale-110'
                  : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-red-600 text-xs font-semibold mb-3">PIN incorrecto</p>
        )}

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
            if (key === '') return <div key="empty" />;
            if (key === 'del') {
              return (
                <button
                  key="del"
                  onClick={handleDelete}
                  className="flex items-center justify-center h-14 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                >
                  <Delete className="w-5 h-5 text-stone-700" />
                </button>
              );
            }
            return (
              <button
                key={key}
                onClick={() => handleNumber(key)}
                className="h-14 bg-stone-50 hover:bg-orange-100 border border-stone-200 rounded-xl text-xl font-bold text-stone-800 transition-colors active:scale-95"
              >
                {key}
              </button>
            );
          })}
        </div>

        <p className="text-center text-[10px] text-stone-400 mt-4">
          PIN por defecto: 1234 (cambiable desde Proveedores)
        </p>
      </div>
    </div>
  );
}
