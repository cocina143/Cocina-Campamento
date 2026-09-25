import { X, CheckCircle2 } from 'lucide-react';
import type { Dish } from '@/data/dishes';
import type { SectionCounts } from '@/data/sections';
import { SECTIONS, effectiveMultiplier } from '@/data/sections';
import type { Persona, TipoDieta } from '@/data/personas';
import { getDesglosePorSeccionParaDieta, getTotalPersonasConDieta } from '@/data/personas';

interface DishModalProps {
  dish: Dish;
  counts: SectionCounts;
  checkedIngredients: Set<string>;
  onToggleIngredient: (key: string) => void;
  onClose: () => void;
  personas?: Persona[];
}

function formatAmount(amount: number, unit: string): { value: string; unit: string } {
  if (unit === 'ud') {
    const rounded = amount % 1 === 0 ? String(amount) : amount.toFixed(1);
    return { value: rounded, unit: 'ud' };
  }
  if (unit === 'g') {
    if (amount >= 1000) {
      const kg = amount / 1000;
      return { value: kg % 1 === 0 ? String(kg) : kg.toFixed(1), unit: 'kg' };
    }
    const rounded = amount % 1 === 0 ? String(amount) : amount.toFixed(1);
    return { value: rounded, unit: 'g' };
  }
  if (unit === 'ml') {
    if (amount >= 1000) {
      const l = amount / 1000;
      return { value: l % 1 === 0 ? String(l) : l.toFixed(1), unit: 'L' };
    }
    const rounded = amount % 1 === 0 ? String(amount) : amount.toFixed(1);
    return { value: rounded, unit: 'ml' };
  }
  const rounded = amount % 1 === 0 ? String(amount) : amount.toFixed(1);
  return { value: rounded, unit };
}

// Determina qué dieta aplica a este plato
function getDietaDelPlato(dish: Dish): TipoDieta | null {
  if (dish.diets?.includes('vegano')) return 'Vegano';
  if (dish.diets?.includes('vegetariano')) return 'Vegetariano';
  // Detectar Halal por ingredientes
  const noHalal = ['cerdo', 'jamon', 'jamón', 'bacon', 'vino', 'alcohol', 'cerveza', 'ron', 'licor'];
  const tieneNoHalal = dish.ingredients?.some((ing) =>
    noHalal.some((nh) => ing.name.toLowerCase().includes(nh))
  );
  if (dish.diets?.includes('halal' as any) || (!tieneNoHalal && dish.name.toLowerCase().includes('halal'))) {
    return 'Halal';
  }
  return null;
}

export function DishModal({ dish, counts, checkedIngredients, onToggleIngredient, onClose, personas = [] }: DishModalProps) {
  const dietaDelPlato = getDietaDelPlato(dish);

  // Calcular desglose según la dieta del plato
  let desglose: { sectionId: string; sectionName: string; count: number; multiplier: number; effectiveCount: number }[];
  let totalEfectivo: number;
  let tituloDieta: string;

    if (dietaDelPlato) {
    // Plato con dieta específica: calcular solo para personas con esa dieta
    desglose = getDesglosePorSeccionParaDieta(counts, personas, dietaDelPlato);
    totalEfectivo = getTotalPersonasConDieta(counts, personas, dietaDelPlato);
    tituloDieta = `${dietaDelPlato.toUpperCase()} (${totalEfectivo.toFixed(1)} raciones)`;
  } else {
    // Plato General: calcular para TODAS las personas (no restar nadie)
    desglose = SECTIONS.map((s) => {
      const totalSeccion = counts[s.id] || 0;
      const multiplier = effectiveMultiplier(s);
      return {
        sectionId: s.id,
        sectionName: s.shortName,
        count: totalSeccion,
        multiplier,
        effectiveCount: totalSeccion * multiplier,
      };
    }).filter((item) => item.count > 0);
    totalEfectivo = desglose.reduce((acc, item) => acc + item.effectiveCount, 0);
    tituloDieta = `GENERAL (${totalEfectivo.toFixed(1)} raciones)`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white z-10 border-b border-stone-200 p-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xl font-bold text-stone-900 pr-4">{dish.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full flex-shrink-0">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {dish.image && (
          <img src={dish.image} alt={dish.name} className="w-full h-48 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}

        <div className="p-4 sm:p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2 flex-wrap">
              Ingredientes y Cantidades
              <span className={`text-xs px-2 py-0.5 rounded-full normal-case font-bold ${
                dietaDelPlato === 'Halal' ? 'bg-blue-100 text-blue-800' :
                dietaDelPlato === 'Vegetariano' ? 'bg-green-100 text-green-800' :
                dietaDelPlato === 'Vegano' ? 'bg-emerald-100 text-emerald-800' :
                'bg-stone-100 text-stone-700'
              }`}>
                {tituloDieta}
              </span>
            </h3>

            {totalEfectivo === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
                ⚠️ No hay personas con dieta <strong>{dietaDelPlato}</strong> asignadas a ninguna sección. Las cantidades serán 0.
              </div>
            )}

            <div className="space-y-4">
              {(dish.ingredients || []).map((ing, idx) => {
                const isChecked = checkedIngredients.has(`${dish.id}-${ing.name}`);
                const amountPerPerson = Number(ing.amount) || 0;
                const totalAmount = amountPerPerson * totalEfectivo;
                const formattedTotal = formatAmount(totalAmount, ing.unit);

                return (
                  <div key={idx} className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => onToggleIngredient(`${dish.id}-${ing.name}`)}
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-stone-300 text-transparent hover:border-green-400'}`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <span className={`font-semibold text-stone-900 ${isChecked ? 'line-through text-stone-400' : ''}`}>{ing.name}</span>
                      </div>
                      <span className="text-sm font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg whitespace-nowrap">
                        {formattedTotal.value} {formattedTotal.unit}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-2 pl-8">
                      {desglose.map((item) => {
                        if (item.effectiveCount === 0) return null;
                        const sectionTotal = amountPerPerson * item.effectiveCount;
                        const formattedSection = formatAmount(sectionTotal, ing.unit);
                        return (
                          <div key={item.sectionId} className="flex justify-between items-center text-sm bg-white p-2 rounded-lg border border-stone-100">
                            <span className="font-semibold text-stone-700">
                              {item.sectionName}
                              <span className="text-xs text-stone-400 ml-1">({item.count} pers.)</span>
                            </span>
                            <span className="font-bold text-stone-800">{formattedSection.value} {formattedSection.unit}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
