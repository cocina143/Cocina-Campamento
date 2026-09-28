import { totalPeople } from '@/data/sections';
import type { SectionCounts } from '@/data/sections';
import { ChefHat, Calendar, Users } from 'lucide-react';

interface HeaderProps {
  counts: SectionCounts;
  date: string;
}

export function Header({ counts, date }: HeaderProps) {
  const total = totalPeople(counts);
  
  // Formatear la fecha (ej: "Lunes, 28 de septiembre de 2026")
  const fechaFormateada = new Date(date).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-stone-900 text-white py-2.5 px-4 sm:px-6 shadow-md">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-1.5 rounded-lg">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">Cocina La Milagrosa 143</h1>
            <p className="text-stone-400 text-[11px] flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              {fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-700">
          <Users className="w-4 h-4 text-orange-400" />
          <div className="text-right">
            <p className="text-[10px] text-stone-400 uppercase font-semibold leading-none">Comensales</p>
            <p className="text-base font-bold text-white leading-none">{total}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
