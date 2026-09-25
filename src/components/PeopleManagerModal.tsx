import { useState } from 'react';
import type { Persona, TipoDieta } from '@/data/personas';
import { DIETA_OPTIONS } from '@/data/personas';
import { Plus, Trash2, X, Users, AlertTriangle } from 'lucide-react';

interface PeopleManagerModalProps {
  personas: Persona[];
  onSavePersonas: (personas: Persona[]) => void;
  onClose: () => void;
}

export function PeopleManagerModal({ personas, onSavePersonas, onClose }: PeopleManagerModalProps) {
  const [localPersonas, setLocalPersonas] = useState<Persona[]>(personas);
  const [nombre, setNombre] = useState('');
  const [nuevaAlergia, setNuevaAlergia] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddPersona = () => {
    if (!nombre.trim()) return;
    const nueva: Persona = { id: Date.now().toString(), nombre: nombre.trim(), alergias: [], dieta: 'General', notas: '' };
    setLocalPersonas([...localPersonas, nueva]);
    setNombre('');
    setEditingId(nueva.id);
  };

  const handleDeletePersona = (id: string) => {
    setLocalPersonas((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleAddAlergia = (personaId: string) => {
    if (!nuevaAlergia.trim()) return;
    setLocalPersonas((prev) => prev.map((p) => p.id === personaId ? { ...p, alergias: [...p.alergias, nuevaAlergia.trim().toLowerCase()] } : p));
    setNuevaAlergia('');
  };

  const handleRemoveAlergia = (personaId: string, index: number) => {
    setLocalPersonas((prev) => prev.map((p) => p.id === personaId ? { ...p, alergias: p.alergias.filter((_, i) => i !== index) } : p));
  };

  const handleUpdateDieta = (personaId: string, dieta: TipoDieta) => {
    setLocalPersonas((prev) => prev.map((p) => p.id === personaId ? { ...p, dieta } : p));
  };

  const handleUpdateNotas = (personaId: string, notas: string) => {
    setLocalPersonas((prev) => prev.map((p) => p.id === personaId ? { ...p, notas } : p));
  };

  const handleSave = () => { onSavePersonas(localPersonas); onClose(); };

  const dietaColor = (dieta: TipoDieta) => {
    switch (dieta) {
      case 'Halal': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Vegetariano': return 'bg-green-100 text-green-800 border-green-300';
      case 'Vegano': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-stone-900">Personas con Alergias / Dietas</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full"><X className="w-5 h-5 text-stone-500" /></button>
        </div>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <span>Añade las alergias y el tipo de dieta de cada persona. La app te alertará si un plato no es compatible.</span>
        </div>

        <div className="mt-4 flex gap-2">
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddPersona()} placeholder="Nombre de la persona" className="flex-1 border border-stone-300 rounded-xl p-2.5 text-sm" />
          <button onClick={handleAddPersona} disabled={!nombre.trim()} className="flex items-center gap-1.5 bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-700 disabled:opacity-50">
            <Plus className="w-4 h-4" /> Añadir
          </button>
        </div>

        <div className="mt-4 space-y-3 max-h-[50vh] overflow-y-auto">
          {localPersonas.length === 0 ? (
            <p className="text-center text-stone-400 italic py-8">No hay personas registradas.</p>
          ) : (
            localPersonas.map((persona) => (
              <div key={persona.id} className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-stone-900">{persona.nombre}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${dietaColor(persona.dieta)}`}>{persona.dieta}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingId(editingId === persona.id ? null : persona.id)} className="text-xs bg-stone-200 px-3 py-1 rounded-lg font-semibold hover:bg-stone-300">
                      {editingId === persona.id ? 'Cerrar' : 'Editar'}
                    </button>
                    <button onClick={() => handleDeletePersona(persona.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {persona.alergias.length === 0 ? (
                    <span className="text-xs text-stone-400 italic">Sin alergias</span>
                  ) : (
                    persona.alergias.map((alergia, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                        ⚠️ {alergia}
                        {editingId === persona.id && <button onClick={() => handleRemoveAlergia(persona.id, idx)} className="hover:text-red-900"><X className="w-3 h-3" /></button>}
                      </span>
                    ))
                  )}
                </div>

                {editingId === persona.id && (
                  <div className="mt-3 pt-3 border-t border-stone-200 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-stone-600 block mb-1">Tipo de dieta</label>
                      <div className="flex flex-wrap gap-2">
                        {DIETA_OPTIONS.map((opt) => (
                          <button key={opt} type="button" onClick={() => handleUpdateDieta(persona.id, opt)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${persona.dieta === opt ? dietaColor(opt) + ' shadow-sm ring-2 ring-offset-1 ring-orange-400' : 'bg-white border-stone-200 text-stone-500 hover:border-stone-400'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={nuevaAlergia} onChange={(e) => setNuevaAlergia(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddAlergia(persona.id)} placeholder="Nueva alergia (ej: melón)" className="flex-1 border border-stone-300 rounded-lg p-2 text-xs" />
                      <button onClick={() => handleAddAlergia(persona.id)} className="bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-orange-200">+ Alergia</button>
                    </div>
                    <textarea value={persona.notas} onChange={(e) => handleUpdateNotas(persona.id, e.target.value)} placeholder="Notas adicionales..." className="w-full border border-stone-300 rounded-lg p-2 text-xs resize-none" rows={2} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <button onClick={handleSave} className="w-full mt-4 bg-stone-900 text-white font-bold py-3 rounded-2xl hover:bg-stone-800 transition-all">Guardar y sincronizar</button>
      </div>
    </div>
  );
}
