import { useState } from 'react';
import type { Proveedor } from '@/data/proveedores';
import { ESPECIALIDADES, getEspecialidadLabel } from '@/data/proveedores';
import { ProveedorFormModal } from '@/components/ProveedorFormModal';
import { ArrowLeft, Plus, Phone, Mail, MapPin, Edit2, Settings } from 'lucide-react';

interface ProveedoresViewProps {
  proveedores: Proveedor[];
  onSaveProveedor: (proveedor: Proveedor) => void;
  onDeleteProveedor: (id: string) => void;
  onBack: () => void;
}

const PIN_KEY = 'cocina-campamento-pin';
const DEFAULT_PIN = '1234';

export function ProveedoresView({ proveedores, onSaveProveedor, onDeleteProveedor, onBack }: ProveedoresViewProps) {
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPinSettings, setShowPinSettings] = useState(false);
  const [nuevoPin, setNuevoPin] = useState('');

  const handleChangePin = () => {
    if (nuevoPin.length !== 4 || !/^\d{4}$/.test(nuevoPin)) {
      alert('El PIN debe ser de 4 dígitos numéricos');
      return;
    }
    try {
      localStorage.setItem(PIN_KEY, nuevoPin);
      alert('✅ PIN actualizado correctamente');
      setNuevoPin('');
      setShowPinSettings(false);
    } catch {
      alert('Error al guardar el PIN');
    }
  };

  // Agrupar por especialidad
  const agrupados = ESPECIALIDADES.map((esp) => ({
    ...esp,
    proveedores: proveedores.filter((p) => p.especialidad === esp.id),
  })).filter((g) => g.proveedores.length > 0);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-stone-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a la cocina
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">📦 Proveedores</span>
          </div>
          <button
            onClick={() => setShowPinSettings(true)}
            className="p-2 hover:bg-stone-800 rounded-lg"
            title="Cambiar PIN"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Botón añadir */}
        <button
          onClick={() => {
            setEditingProveedor(null);
            setShowForm(true);
          }}
          className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white font-bold py-3 rounded-2xl hover:bg-orange-700 transition-all shadow-sm mb-6"
        >
          <Plus className="w-5 h-5" />
          Añadir nuevo proveedor
        </button>

        {proveedores.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200">
            <p className="text-5xl mb-3">📦</p>
            <h3 className="text-lg font-bold text-stone-800">No hay proveedores registrados</h3>
            <p className="text-stone-500 text-sm mt-2">Pulsa el botón de arriba para añadir el primero.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {agrupados.map((grupo) => (
              <section key={grupo.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{grupo.icon}</span>
                  <h2 className="text-base font-bold text-stone-900">{grupo.label}</h2>
                  <span className="text-xs bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-semibold">
                    {grupo.proveedores.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {grupo.proveedores.map((prov) => (
                    <div
                      key={prov.id}
                      className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-stone-900 text-base">{prov.nombre}</h3>
                        <button
                          onClick={() => {
                            setEditingProveedor(prov);
                            setShowForm(true);
                          }}
                          className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1.5 text-sm">
                        {prov.telefono && (
                          <a
                            href={`tel:${prov.telefono}`}
                            className="flex items-center gap-2 text-stone-700 hover:text-orange-600"
                          >
                            <Phone className="w-4 h-4 text-stone-400" />
                            <span className="font-medium">{prov.telefono}</span>
                          </a>
                        )}
                        {prov.email && (
                          <a
                            href={`mailto:${prov.email}`}
                            className="flex items-center gap-2 text-stone-700 hover:text-orange-600 truncate"
                          >
                            <Mail className="w-4 h-4 text-stone-400 flex-shrink-0" />
                            <span className="truncate">{prov.email}</span>
                          </a>
                        )}
                        {prov.direccion && (
                          <div className="flex items-start gap-2 text-stone-600">
                            <MapPin className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                            <span className="text-xs">{prov.direccion}</span>
                          </div>
                        )}
                        {prov.notas && (
                          <p className="text-xs text-stone-500 italic pt-1 border-t border-stone-100 mt-2">
                            {prov.notas}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Modal de formulario */}
      {showForm && (
        <ProveedorFormModal
          proveedor={editingProveedor}
          onSave={(p) => {
            onSaveProveedor(p);
            setShowForm(false);
            setEditingProveedor(null);
          }}
          onDelete={(id) => {
            onDeleteProveedor(id);
            setShowForm(false);
            setEditingProveedor(null);
          }}
          onClose={() => {
            setShowForm(false);
            setEditingProveedor(null);
          }}
        />
      )}

      {/* Modal de cambio de PIN */}
      {showPinSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-stone-900 mb-3">Cambiar PIN de acceso</h2>
            <p className="text-xs text-stone-600 mb-4">
              PIN actual: <strong>{localStorage.getItem(PIN_KEY) || DEFAULT_PIN}</strong>
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={nuevoPin}
              onChange={(e) => setNuevoPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Nuevo PIN (4 dígitos)"
              className="w-full border border-stone-300 rounded-xl p-3 text-center text-2xl tracking-widest font-bold"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowPinSettings(false);
                  setNuevoPin('');
                }}
                className="flex-1 border border-stone-300 rounded-xl py-2.5 text-sm font-semibold hover:bg-stone-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePin}
                className="flex-1 bg-orange-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-orange-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
