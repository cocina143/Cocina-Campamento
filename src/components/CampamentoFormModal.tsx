import { useState, useEffect } from 'react';
import type { Campamento } from '@/data/campamentos';
import { X, Save, Trash2 } from 'lucide-react';

interface CampamentoFormModalProps {
  campamento: Campamento | null;
  onSave: (campamento: Campamento) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function CampamentoFormModal({ campamento, onSave, onDelete, onClose }: CampamentoFormModalProps) {
  const [form, setForm] = useState<Campamento>({
    id: Date.now().toString(),
    nombre: '',
    anio: new Date().getFullYear(),
    ubicacion: '',
    notas: '',
  });

  useEffect(() => {
    if (campamento) setForm(campamento);
  }, [campamento]);

  const handleSave = () => {
    if (!form.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    onSave(form);
  };

  const handleDelete = () => {
    if (campamento && onDelete && confirm(`¿Eliminar "${campamento.nombre}"?`)) {
      onDelete(campamento.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white z-10 border-b border-stone-200 p-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-lg font-bold text-stone-900">
            {campamento ? 'Editar Campamento' : 'Nuevo Campamento'}
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
              placeholder="Ej: Campamento Sierra de Gredos"
              className="w-full border border-stone-300 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 block mb-1">Año</label>
            <input
              type="number"
              value={form.anio}
              onChange={(e) => setForm({ ...form, anio: parseInt(e.target.value) || new Date().getFullYear() })}
              className="w-full border border-stone-300 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 block mb-1">Ubicación</label>
            <input
              type="text"
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
              placeholder="Ej: Sierra de Gredos, Ávila"
              className="w-full border border-stone-300 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 block mb-1">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              placeholder="Observaciones sobre el campamento..."
              rows={3}
              className="w-full border border-stone-300 rounded-xl p-2.5 text-sm resize-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-stone-200 p-4 flex gap-2">
          {campamento && onDelete && (
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
