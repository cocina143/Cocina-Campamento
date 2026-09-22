import { X, Users, Calendar, RotateCcw, Info } from 'lucide-react';
import { useState } from 'react';
import { SECTIONS, type SectionCounts, type SectionId } from '@/data/sections';
import { totalPeople, CHILD_REDUCTION } from '@/data/sections';

interface SectionPanelProps {
  counts: SectionCounts;
  date: string;
  onChange: (counts: SectionCounts) => void;
  onDateChange: (date: string) => void;
  onClose: () => void;
}

export function SectionPanel({ counts, date, onChange, onDateChange, onClose }: SectionPanelProps) {
  const update = (id: SectionId, value: number) => {
    onChange({ ...counts, [id]: Math.max(0, Math.min(999, value)) });
  };

  const adjust = (id: SectionId, delta: number) => {
    update(id, (counts[id] || 0) + delta);
  };

  const reset = () => {
    onChange({
      'manada-ninos': 0,
      'manada-adultos': 0,
      tropa: 0,
      pioneros: 0,
      rutas: 0,
      cocina: 0,
    });
  };

  const total = totalPeople(counts);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-stone-50 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-stone-900 text-white px-5 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-orange-400" />
            <div>
              <h2 className="font-bold text-lg">Panel de Secciones</h2>
              <p className="text-stone-400 text-xs">Configura los comensales del día</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Date selector */}
          <div className="flex items-center gap-3 mb-5 p-3 bg-orange-50 rounded-xl border border-orange-100">
            <Calendar className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div className="flex-1">
              <label className="text-stone-500 text-xs">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                className="block w-full bg-transparent text-stone-900 font-semibold text-sm outline-none"
              />
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2 mb-5 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 text-xs leading-relaxed">
              Los <strong>niños de Manada</strong> llevan un {CHILD_REDUCTION * 100}% menos de cantidad por persona. El resto de secciones usan la ración completa.
            </p>
          </div>

          {/* Section counters */}
          <div className="space-y-3">
            {SECTIONS.map((section) => {
              const value = counts[section.id] || 0;
              return (
                <div
                  key={section.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border ${section.bgColor} ${section.borderColor}`}
                >
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${section.textColor}`}>{section.name}</p>
                    {section.isChildSection && (
                      <span className="text-xs text-stone-500">Ración reducida (-30%)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-white rounded-full border border-stone-200 shadow-sm p-1">
                    <button
                      onClick={() => adjust(section.id, -1)}
                      disabled={value <= 0}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => update(section.id, parseInt(e.target.value) || 0)}
                      className="w-12 text-center font-bold text-base text-stone-900 bg-transparent outline-none tabular-nums no-spin"
                    />
                    <button
                      onClick={() => adjust(section.id, 1)}
                      disabled={value >= 999}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total + reset */}
          <div className="mt-5 flex items-center justify-between p-4 bg-stone-900 rounded-xl text-white">
            <div>
              <p className="text-stone-400 text-xs">Total comensales del día</p>
              <p className="text-2xl font-bold tabular-nums">{total}</p>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 text-stone-300 text-sm font-semibold hover:bg-white/20 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
