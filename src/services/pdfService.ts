import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Dish } from '@/data/dishes';
import type { DayMenu } from '@/data/menu';
import type { SectionCounts } from '@/data/sections';
import type { Persona, TipoDieta } from '@/data/personas';
import { totalPeople, SECTIONS, effectiveMultiplier } from '@/data/sections';

interface ConsolidatedItem {
  name: string;
  amount: number;
  unit: string;
}

// ─── LÓGICA DE DIETAS (Autónoma) ───
function getDietaDelPlato(dish: Dish): TipoDieta | null {
  if (dish.diets?.includes('vegano')) return 'Vegano';
  if (dish.diets?.includes('vegetariano')) return 'Vegetariano';
  
  const noHalal = ['cerdo', 'jamon', 'jamón', 'bacon', 'vino', 'alcohol', 'cerveza', 'ron', 'licor'];
  const tieneNoHalal = dish.ingredients?.some((ing) =>
    noHalal.some((nh) => ing.name.toLowerCase().includes(nh))
  );
  
  // Si NO tiene ingredientes prohibidos y el nombre sugiere halal, o si está marcado explícitamente
  if (!tieneNoHalal && (dish.name.toLowerCase().includes('halal') || dish.diets?.includes('halal' as any))) {
    return 'Halal';
  }
  return null;
}

function esIncompatibleConDieta(dish: Dish, dieta: TipoDieta): boolean {
  const ingredientes = (dish.ingredients || []).map((ing) => ing.name.toLowerCase());
  const textoCompleto = [...ingredientes, dish.name.toLowerCase()].join(' ');

  if (dieta === 'Vegetariano') {
    const noVegetariano = ['cerdo', 'pollo', 'carne', 'vacuno', 'ternera', 'cordero', 'pescado', 'marisco', 'gamba', 'atun', 'salmon', 'bacalao', 'merluza', 'jamon', 'bacon', 'chorizo', 'salchicha'];
    return noVegetariano.some((ing) => textoCompleto.includes(ing));
  }
  if (dieta === 'Vegano') {
    const noVegano = ['cerdo', 'pollo', 'carne', 'vacuno', 'pescado', 'marisco', 'huevo', 'leche', 'queso', 'yogur', 'nata', 'mantequilla', 'miel', 'jamon', 'bacon'];
    return noVegano.some((ing) => textoCompleto.includes(ing));
  }
  if (dieta === 'Halal') {
    const noHalal = ['cerdo', 'jamon', 'bacon', 'vino', 'alcohol', 'cerveza', 'ron', 'licor'];
    return noHalal.some((ing) => textoCompleto.includes(ing));
  }
  return false;
}

function getPersonasEfectivasParaPlato(dish: Dish, counts: SectionCounts, personas: Persona[]): number {
  const dietaDelPlato = getDietaDelPlato(dish);
  
  if (dietaDelPlato) {
    // Plato Especial: Solo cuentan las personas con esa dieta específica
    let total = 0;
    personas.forEach((p) => {
      if (p.dieta === dietaDelPlato && p.seccion) {
        const section = SECTIONS.find(s => s.id === p.seccion);
        if (section) {
          total += effectiveMultiplier(section);
        }
      }
    });
    return total;
  } else {
    // Plato General: Todos MENOS los que tienen dieta incompatible
    let totalGeneral = 0;
    
    // Primero calculamos el total base considerando multiplicadores de sección
    SECTIONS.forEach((s) => {
      const count = counts[s.id] || 0;
      totalGeneral += count * effectiveMultiplier(s);
    });

    // Ahora restamos a las personas con dietas especiales que NO pueden comer este plato
    personas.forEach((p) => {
      if (p.dieta !== 'General' && p.seccion) {
        if (esIncompatibleConDieta(dish, p.dieta)) {
          const section = SECTIONS.find(s => s.id === p.seccion);
          if (section) {
            totalGeneral -= effectiveMultiplier(section);
          }
        }
      }
    });

    return Math.max(0, totalGeneral);
  }
}

// ─── UTILIDADES PDF ───
function consolidateIngredients(dishes: Dish[], comensales: number): ConsolidatedItem[] {
  const map = new Map<string, ConsolidatedItem>();
  dishes.forEach((dish) => {
    (dish.ingredients || []).forEach((ing) => {
      const cleanName = ing.name ? ing.name.trim() : '';
      if (!cleanName) return;
      const key = `${cleanName.toLowerCase()}_${ing.unit.toLowerCase()}`;
      const qty = Number(ing.amount) || 0;
      if (map.has(key)) {
        map.get(key)!.amount += qty * comensales;
      } else {
        map.set(key, { name: cleanName, amount: qty * comensales, unit: ing.unit || 'g' });
      }
    });
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function getDishesForMeal(dayMenu: DayMenu, meal: 'desayuno' | 'comida' | 'merienda' | 'cena', allDishes: Dish[]): Dish[] {
  const ids = dayMenu[meal] || [];
  return allDishes.filter((d) => ids.includes(d.id) || ids.includes(d.name));
}

function formatQty(amount: number, unit: string): string {
  const rounded = Math.round(amount * 100) / 100;
  if (unit === 'g' && rounded >= 1000) return `${(rounded / 1000).toFixed(2)} kg`;
  if (unit === 'ml' && rounded >= 1000) return `${(rounded / 1000).toFixed(2)} L`;
  return `${rounded} ${unit}`;
}

export function generateDailyShoppingPDF(
  dayMenu: DayMenu,
  allDishes: Dish[],
  counts: SectionCounts,
  personas: Persona[] = [],
  campName: string = 'Cocina La Milagrosa 143'
): void {
  const doc = new jsPDF();
  let currentY = 20;

  // Cabecera
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(campName, 14, currentY);
  currentY += 8;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Lista de la Compra — Día ${dayMenu.day}`, 14, currentY);
  currentY += 6;

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Comensales totales registrados: ${totalPeople(counts)}`, 14, currentY);
  currentY += 10;

  const meals = [
    { key: 'desayuno', label: 'DESAYUNO' },
    { key: 'comida', label: 'COMIDA' },
    { key: 'merienda', label: 'MERIENDA' },
    { key: 'cena', label: 'CENA' },
  ] as const;

  meals.forEach((meal) => {
    const mealDishes = getDishesForMeal(dayMenu, meal.key, allDishes);
    if (mealDishes.length === 0) return;

    // Título turno
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text(meal.label, 14, currentY);
    currentY += 5;

    // Agrupar platos por tipo de dieta detectada
    const grupos: Record<string, { platos: Dish[]; maxComensales: number }> = {};
    
    mealDishes.forEach((dish) => {
      const dieta = getDietaDelPlato(dish) || 'General';
      const comensales = getPersonasEfectivasParaPlato(dish, counts, personas);
      
      if (!grupos[dieta]) {
        grupos[dieta] = { platos: [], maxComensales: 0 };
      }
      grupos[dieta].platos.push(dish);
      // Usamos el máximo de comensales encontrados para ese grupo de dieta
      if (comensales > grupos[dieta].maxComensales) {
        grupos[dieta].maxComensales = comensales;
      }
    });

    Object.entries(grupos).forEach(([dieta, data]) => {
      if (data.maxComensales === 0) return; // No generar tabla si nadie come esto

      const ingredients = consolidateIngredients(data.platos, data.maxComensales);
      if (ingredients.length === 0) return;

      // Subtítulo grupo
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(`${dieta} (${data.maxComensales.toFixed(1)} raciones)`, 14, currentY);
      currentY += 4;

      autoTable(doc, {
        startY: currentY,
        head: [['Ingrediente', 'Cantidad', 'Unidad']],
        body: ingredients.map((item) => [item.name, formatQty(item.amount, item.unit), item.unit]),
        theme: 'grid',
        headStyles: { fillColor: [251, 146, 60], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 45, halign: 'right' }, 2: { cellWidth: 30, halign: 'center' } },
        didDrawPage: (d) => { currentY = d.cursor.y + 5; },
      });
      currentY += 5;
    });
  });

  // Resumen Total Día
  if (currentY > 230) { doc.addPage(); currentY = 20; }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text('RESUMEN TOTAL DEL DÍA', 14, currentY);
  currentY += 8;

  const todosPlatos = [
    ...getDishesForMeal(dayMenu, 'desayuno', allDishes),
    ...getDishesForMeal(dayMenu, 'comida', allDishes),
    ...getDishesForMeal(dayMenu, 'merienda', allDishes),
    ...getDishesForMeal(dayMenu, 'cena', allDishes),
  ];

  const gruposTotales: Record<string, { platos: Dish[]; maxComensales: number }> = {};
  todosPlatos.forEach((dish) => {
    const dieta = getDietaDelPlato(dish) || 'General';
    const comensales = getPersonasEfectivasParaPlato(dish, counts, personas);
    if (!gruposTotales[dieta]) gruposTotales[dieta] = { platos: [], maxComensales: 0 };
    gruposTotales[dieta].platos.push(dish);
    if (comensales > gruposTotales[dieta].maxComensales) gruposTotales[dieta].maxComensales = comensales;
  });

  Object.entries(gruposTotales).forEach(([dieta, data]) => {
    if (data.maxComensales === 0) return;
    const ingredients = consolidateIngredients(data.platos, data.maxComensales);
    if (ingredients.length === 0) return;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`${dieta} (${data.maxComensales.toFixed(1)} raciones)`, 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [['Ingrediente', 'Total', 'Unidad']],
      body: ingredients.map((item) => [item.name, formatQty(item.amount, item.unit), item.unit]),
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 50, halign: 'right' }, 2: { cellWidth: 30, halign: 'center' } },
      didDrawPage: (d) => { currentY = d.cursor.y + 5; },
    });
    currentY += 5;
  });

  doc.save(`Compra_Dia_${dayMenu.day}.pdf`);
}

export function generateGlobalShoppingPDF(
  menuList: DayMenu[],
  allDishes: Dish[],
  counts: SectionCounts,
  personas: Persona[] = [],
  campName: string = 'Cocina La Milagrosa 143'
): void {
  const doc = new jsPDF();
  let currentY = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(campName, 14, currentY);
  currentY += 8;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Lista de la Compra Global — 15 Días', 14, currentY);
  currentY += 6;

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Comensales base: ${totalPeople(counts)}`, 14, currentY);
  currentY += 10;

  const globalGrupos: Record<string, { platos: Dish[]; maxComensales: number }> = {};

  menuList.forEach((dayMenu) => {
    const allMeals = [
      ...(dayMenu.desayuno || []),
      ...(dayMenu.comida || []),
      ...(dayMenu.merienda || []),
      ...(dayMenu.cena || []),
    ];
    const dayDishes = allDishes.filter((d) => allMeals.includes(d.id) || allMeals.includes(d.name));
    
    dayDishes.forEach((dish) => {
      const dieta = getDietaDelPlato(dish) || 'General';
      const comensales = getPersonasEfectivasParaPlato(dish, counts, personas);
      
      if (!globalGrupos[dieta]) {
        globalGrupos[dieta] = { platos: [], maxComensales: 0 };
      }
      globalGrupos[dieta].platos.push(dish);
      if (comensales > globalGrupos[dieta].maxComensales) {
        globalGrupos[dieta].maxComensales = comensales;
      }
    });
  });

  Object.entries(globalGrupos).forEach(([dieta, data]) => {
    if (data.maxComensales === 0) return;
    const ingredients = consolidateIngredients(data.platos, data.maxComensales);
    if (ingredients.length === 0) return;

    if (currentY > 230) { doc.addPage(); currentY = 20; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`${dieta} (${data.maxComensales.toFixed(1)} raciones)`, 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [['Ingrediente', 'Total 15 días', 'Unidad']],
      body: ingredients.map((item) => [item.name, formatQty(item.amount, item.unit), item.unit]),
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 50, halign: 'right' }, 2: { cellWidth: 30, halign: 'center' } },
      didDrawPage: (d) => { currentY = d.cursor.y + 5; },
    });
    currentY += 5;
  });

  doc.save(`Compra_Global_15_Dias.pdf`);
}
