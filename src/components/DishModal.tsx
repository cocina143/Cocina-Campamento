import { useState, useEffect } from 'react';
import { X, Clock, Flame, CheckCircle2, Circle, Users, Sigma } from 'lucide-react';
import type { Dish } from '@/data/dishes';
import type { SectionCounts, Section } from '@/data/sections';
import { SECTIONS, totalPeople, effectiveMultiplier } from '@/data/sections';
import { calculateBreakdown, formatAmount } from '@/utils/calculations';

interface DishModalProps {
  dish: Dish;
  counts: SectionCounts;
  checkedIngredients: Set<string>;
  onToggleIngredient: (key: string) => void;
  onClose: () => void;
}

const difficultyColors: Record<Dish['difficulty'], string> = {
  'Fácil': 'bg-green-100 text-green-700',
  'Media': 'bg-amber-100 text-amber-700',
  'Compleja': 'bg-red-100 text-red-700',
};

export function DishModal({
  dish,
  counts,
  checkedIngredients,
  onToggleIngredient,
  onClose,
}: DishModalProps) {
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const total = totalPeople(counts);
  const checkedCount = dish.ingredients.filter((ing) =>
    checkedIngredients.has(`${dish.id}-${ing.name}`),
  ).length;
  const allChecked = checkedCount === dish.ingredients.length;

  const activeSections = SECTIONS.filter((s) => counts[s.id] > 0);

  // Grand totals across all sections
  const grandTotals = dish.ingredients.map((ing) => {
    const breakdown = calculateBreakdown(ing, counts);
    return { ing, total: breakdown.total };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-stone-50 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagen header */}
        <div className="relative h-56 sm:h-64 overflow-hidden rounded-t-3xl">
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${difficultyColors[dish.difficulty]}`}>
                {dish.difficulty}
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white">
                <Clock className="w-3 h-3" />
                {dish.prepTime}
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white">
                <Flame className="w-3 h-3" />
                {dish.ingredients.length} ingredientes
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">{dish.name}</h2>
            <p className="text-white/80 text-sm mt-1">{dish.description}</p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {/* Resumen de comensales */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-stone-500 text-xs">Ingredientes calculados para</p>
                  <p className="text-stone-900 font-bold text-lg">
                    {total} <span className="text-stone-500 font-normal text-sm">comensales en {activeSections.length} {activeSections.length === 1 ? 'sección' : 'secciones'}</span>
                  </p>
                </div>
              </div>
              {allChecked && (
                <span className="flex items-center gap-1.5 text-green-600 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  Todo listo
                </span>
              )}
            </div>
          </div>

          {/* Cabecera de ingredientes */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-stone-900 text-lg">Ingredientes por sección</h3>
            <span className="text-sm text-stone-500">
              {checkedCount}/{dish.ingredients.length} revisados
            </span>
          </div>

          {total === 0 ? (
            <div className="text-center py-8 text-stone-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Configura comensales en el panel de secciones para ver las cantidades.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Una sección por bloque */}
              {activeSections.map((section) => {
                const people = counts[section.id];
                const multiplier = effectiveMultiplier(section);
                const sectionChecked = dish.ingredients.filter((ing) =>
                  checkedIngredients.has(`${dish.id}-${ing.name}`),
                ).length;

                return (
                  <SectionIngredientBlock
                    key={section.id}
                    dish={dish}
                    section={section}
                    people={people}
                    multiplier={multiplier}
                    checkedIngredients={checkedIngredients}
                    onToggleIngredient={onToggleIngredient}
                  />
                );
              })}

              {/* Total combinado */}
              <div className="rounded-2xl border-2 border-stone-800 bg-stone-800 text-white overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                  <Sigma className="w-5 h-5 text-orange-400" />
                  <div className="flex-1">
                    <p className="font-bold text-base">Total combinado</p>
                    <p className="text-stone-400 text-xs">Suma de todas las secciones · {total} comensales</p>
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {grandTotals.map(({ ing, total: ingTotal }) => (
                    <div key={ing.name} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-lg flex-shrink-0">{ing.icon}</span>
                      <span className="flex-1 text-sm font-medium text-stone-200">{ing.name}</span>
                      <span className="font-bold tabular-nums text-orange-400 text-sm">
                        {formatAmount(ingTotal, ing.unit)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Elaboración */}
          <div className="mt-6">
            <button
              onClick={() => setShowSteps((s) => !s)}
              className="w-full flex items-center justify-between p-4 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors"
            >
              <span className="font-bold text-stone-800">Elaboración</span>
              <span className="text-stone-500 text-sm">{showSteps ? 'Ocultar' : 'Mostrar'}</span>
            </button>
            {showSteps && (
              <ol className="mt-3 space-y-3">
                {dish.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-600 text-white text-sm font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="text-stone-700 text-sm pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sub-componente: bloque de ingredientes por sección ---------- */

interface SectionBlockProps {
  dish: Dish;
  section: Section;
  people: number;
  multiplier: number;
  checkedIngredients: Set<string>;
  onToggleIngredient: (key: string) => void;
}

function SectionIngredientBlock({
  dish,
  section,
  people,
  multiplier,
  checkedIngredients,
  onToggleIngredient,
}: SectionBlockProps) {
  return (
    <div className={`rounded-2xl border-2 ${section.borderColor} overflow-hidden`}>
      {/* Cabecera de sección */}
      <div className={`flex items-center gap-3 px-4 py-3 ${section.bgColor} border-b ${section.borderColor}`}>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${section.textColor} font-bold text-sm`}>
          {people}
        </div>
        <div className="flex-1">
          <p className={`font-bold text-sm ${section.textColor}`}>{section.name}</p>
          <p className="text-stone-500 text-xs">
            {people} {people === 1 ? 'persona' : 'personas'}
            {section.isChildSection && (
              <span className="ml-1">· ración −30%</span>
            )}
          </p>
        </div>
      </div>

      {/* Lista de ingredientes de esta sección */}
      <div className="divide-y divide-stone-100 bg-white">
        {dish.ingredients.map((ing) => {
          const key = `${dish.id}-${ing.name}`;
          const isChecked = checkedIngredients.has(key);
          const amount = ing.amountPerPerson * multiplier * people;

          return (
            <button
              key={ing.name}
              onClick={() => onToggleIngredient(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 text-left ${
                isChecked ? 'bg-green-50/60' : 'hover:bg-stone-50'
              }`}
            >
              <span className="text-xl flex-shrink-0">{ing.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${isChecked ? 'text-green-800 line-through' : 'text-stone-800'}`}>
                  {ing.name}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`font-bold tabular-nums text-sm ${isChecked ? 'text-green-700' : section.textColor}`}>
                  {formatAmount(amount, ing.unit)}
                </p>
              </div>
              {isChecked ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-stone-300 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
