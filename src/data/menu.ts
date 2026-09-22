export interface DayMenu {
  dayNumber: number;
  date?: string;
  desayuno?: string[];
  comida?: string[];
  merienda?: string[];
  cena?: string[];
  comensalesOverride?: number;
}

// AÑADIR "export" AQUÍ:
export const INITIAL_MENU: DayMenu[] = [
  { dayNumber: 1, desayuno: [], comida: [], merienda: [], cena: [] },
  { dayNumber: 2, desayuno: [], comida: [], merienda: [], cena: [] },
  // ... resto de los 15 días
];