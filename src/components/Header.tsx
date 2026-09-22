import { ChefHat, Users } from 'lucide-react';
import type { SectionCounts } from '@/data/sections';
import { totalPeople } from '@/data/sections';

interface HeaderProps {
  counts: SectionCounts;
  date: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function Header({ counts, date }: HeaderProps) {
  const total = totalPeople(counts);

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-orange-950 text-white">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'url(https://images.pexels.com/photos/31107959/pexels-photo-31107959.jpeg?auto=compress&cs=tinysrgb&h=650&w=940)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Cocina La Milagrosa 143</h1>
            <p className="text-stone-400 text-sm">Calculadora de ingredientes por secciones</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
            <Users className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 font-bold text-lg tabular-nums">{total}</span>
            <span className="text-stone-300 text-sm">comensales en total</span>
          </div>
          {date && (
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <span className="text-stone-300 text-sm capitalize">{formatDate(date)}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
