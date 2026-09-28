import { useState, useEffect } from 'react';
import type { Proveedor, EspecialidadProveedor } from '@/data/proveedores';
import { ESPECIALIDADES } from '@/data/proveedores';
import { X, Save, Trash2 } from 'lucide-react';

interface ProveedorFormModalProps {
  proveedor: Proveedor | null;
  onSave: (proveedor: Proveedor) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function ProveedorFormModal({ proveedor, onSave, onDelete, onClose }: ProveedorFormModalProps) {
  const [form, setForm] = useState<Proveedor>({
    id: Date.now().toString(),
    nombre: '',
    telefono: '',
    email: '',
    especialidad: 'otros',
    direccion: '',
    notas: '',
  });

  useEffect(() => {
    if (proveedor) setForm(proveedor);
  }, [proveedor]);

  const handleSave = () => {
    if (!form.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    onSave(form);
  };

  const handleDelete = () => {
    if (proveedor && onDelete && confirm(`¿Eliminar a "${proveedor.nombre}"?`)) {
      onDelete(proveedor.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white z-10 border-b border-stone-200 p-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-lg font-bold text-stone-900">
            {proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-600 block mb-1">Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Carnicería López"
              className="w-full border border-stone-300 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 block mb-1">Especialidad</label>
            <div className="grid grid-cols-2 gap-2">
              {ESPECIALIDADES.map((esp) => (
                <button
                  key={esp.id}
                  type="button"
                  onClick={() => setForm({ ...form, especialidad: esp.id as EspecialidadProveedor })}
                  className={`p-2 rounded-xl border text-xs font-semibold text-left transition-all ${
                    form.especialidad === esp.id
                      ? 'bg-orange-100 border-orange-400 text-orange-800 shadow-sm'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <span className="mr-1">{esp.icon}</span>
                  {esp.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-600 block mb-1">Teléfono</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="666 123 456"
                className="w-full border border-stone-300 rounded-xl p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-600 block mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@ejemplo.com"
                className="w-full border border-stone-300 rounded-xl p-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 block mb-1">Dirección</label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              placeholder="Calle, número, ciudad"
              className="w-full border border-stone-300 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 block mb-1">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              placeholder="Horarios, condiciones de pago, pedidos mínimos..."
              rows={3}
              className="w-full border border-stone-300 rounded-xl p-2.5 text-sm resize-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-stone-200 p-4 flex gap-2">
          {proveedor && onDelete && (
            <button
              onClick={handleDelete}
              className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white font-bold py-2.5 rounded-xl hover:bg-orange-700 transition-all"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
          <button
            onClick={onClose}
            className="px-4 border border-stone-300 rounded-xl hover:bg-stone-100 text-sm font-semibold"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
