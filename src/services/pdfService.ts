import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Dish } from '@/data/dishes';
import type { DayMenu } from '@/data/menu';
import type { SectionCounts } from '@/data/sections';
import { SECTIONS, effectiveMultiplier } from '@/data/sections';
import type { Persona, TipoDieta } from '@/data/personas';
import { getTotalPersonasConDieta, esIncompatibleConDieta, getDietasCompatiblesDelPlato } from '@/data/personas';
import type { Proveedor } from '@/data/proveedores';
import { agruparIngredientesPorProveedor } from '@/data/proveedores';

interface ConsolidatedItem {
  name: string;
  amount: number;
  unit: string;
}

// ─── LÓGICA DE DIETAS (Unificada y robusta) ───
function getDietasCompatiblesDelPlato(dish: Dish): TipoDieta[] {
  const dietas: TipoDieta[] = [];
  const dietsLower = (dish.diets || []).map(d => String(d).toLowerCase().trim());
  
  if (dietsLower.includes('vegano')) dietas.push('Vegano');
  if (dietsLower.includes('vegetariano')) dietas.push('Vegetariano');
  if (dietsLower.includes('pescetariano')) dietas.push('Pescetariano');
  
  const noHalal = ['cerdo', 'jamon', 'jamón', 'bacon', 'vino', 'alcohol', 'cerveza', 'ron', 'licor'];
  const tieneNoHalal = dish.ingredients?.some((ing) => noHalal.some((nh) => ing.name.toLowerCase().includes(nh)));
  if (dietsLower.includes('halal') || (!tieneNoHalal && dish.name.toLowerCase().includes('halal'))) {
    dietas.push('Halal');
  }
  return dietas;
}

function getPersonasEfectivasParaPlato(dish: Dish, counts: SectionCounts, personas: Persona[]): number {
  const dietasDelPlato = getDietasCompatiblesDelPlato(dish);
  
  if (dietasDelPlato.length > 0) {
    let total = 0;
    dietasDelPlato.forEach(dieta => {
      total += getTotalPersonasConDieta(counts, personas, dieta);
    });
    return total;
  } else {
    // Plato General
    let totalGeneral = 0;
    SECTIONS.forEach((s) => {
      totalGeneral += (counts[s.id] || 0) * effectiveMultiplier(s);
    });
    
    // Restar personas con dietas o alergias incompatibles
    personas.forEach((p) => {
      if (p.dieta !== 'General' && esIncompatibleConDieta(dish, p.dieta)) {
        const section = SECTIONS.find(s => s.id === p.seccion);
        if (section) totalGeneral -= effectiveMultiplier(section);
      }
      // Nota: Para simplificar en PDF, nos centramos en dietas. Las alergias específicas 
      // suelen gestionarse como raciones aparte, pero si quieres restarlas, avísame.
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

// ─── PDF DIARIO ───
export function generateDailyShoppingPDF(
  dayMenu: DayMenu,
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
  doc.text(`Lista de la Compra — Día ${dayMenu.day}`, 14, currentY);
  currentY += 6;

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Comensales totales registrados: ${Object.values(counts).reduce((a, b) => a + b, 0)}`, 14, currentY);
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

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text(meal.label, 14, currentY);
    currentY += 5;

    // Agrupar platos por su dieta principal para el PDF
    const grupos: Record<string, { platos: Dish[]; maxComensales: number }> = {};
    mealDishes.forEach((dish) => {
      const dietas = getDietasCompatiblesDelPlato(dish);
      const grupoKey = dietas.length > 0 ? dietas[0] : 'General';
      
      if (!grupos[grupoKey]) grupos[grupoKey] = { platos: [], maxComensales: 0 };
      grupos[grupoKey].platos.push(dish);
      
      const comensales = getPersonasEfectivasParaPlato(dish, counts, personas);
      if (comensales > grupos[grupoKey].maxComensales) {
        grupos[grupoKey].maxComensales = comensales;
      }
    });

    Object.entries(grupos).forEach(([dieta, data]) => {
      if (data.maxComensales === 0 && data.platos.length > 0) {
        // Fallback si el cálculo da 0 pero hay platos
        data.maxComensales = 1; 
      }
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
        head: [['Ingrediente', 'Cantidad', 'Unidad']],
        body: ingredients.map((item) => [item.name, formatQty(item.amount, item.unit), item.unit]),
        theme: 'grid',
        headStyles: { fillColor: [251, 146, 60], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 45, halign: 'right' }, 2: { cellWidth: 30, halign: 'center' } },
        didDrawPage: (d) => { currentY = (d as any).cursor.y + 5; },
      });
      currentY += 5;
    });
  });

  doc.save(`Compra_Dia_${dayMenu.day}.pdf`);
}

// ─── PDF GLOBAL 15 DÍAS ───
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
  doc.text(`Comensales base: ${Object.values(counts).reduce((a, b) => a + b, 0)}`, 14, currentY);
  currentY += 10;

  const globalGrupos: Record<string, { platos: Dish[]; maxComensales: number }> = {};

  menuList.forEach((dayMenu) => {
    const allMeals = [...(dayMenu.desayuno || []), ...(dayMenu.comida || []), ...(dayMenu.merienda || []), ...(dayMenu.cena || [])];
    const dayDishes = allDishes.filter((d) => allMeals.includes(d.id) || allMeals.includes(d.name));
    
    dayDishes.forEach((dish) => {
      const dietas = getDietasCompatiblesDelPlato(dish);
      const grupoKey = dietas.length > 0 ? dietas[0] : 'General';
      
      if (!globalGrupos[grupoKey]) globalGrupos[grupoKey] = { platos: [], maxComensales: 0 };
      globalGrupos[grupoKey].platos.push(dish);
      
      const comensales = getPersonasEfectivasParaPlato(dish, counts, personas);
      if (comensales > globalGrupos[grupoKey].maxComensales) {
        globalGrupos[grupoKey].maxComensales = comensales;
      }
    });
  });

  Object.entries(globalGrupos).forEach(([dieta, data]) => {
    if (data.maxComensales === 0 && data.platos.length > 0) data.maxComensales = 1;
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
      didDrawPage: (d) => { currentY = (d as any).cursor.y + 5; },
    });
    currentY += 5;
  });

  doc.save(`Compra_Global_15_Dias.pdf`);
}

// ─── PDF COMPRA POR PROVEEDOR ───
export function generateCompraPorProveedorPDF(
  dayMenu: DayMenu,
  allDishes: Dish[],
  counts: SectionCounts,
  personas: Persona[],
  proveedores: Proveedor[],
  campName: string = 'Cocina La Milagrosa 143'
): void {
  const doc = new jsPDF();
  let currentY = 20;

    const todosIngredientes: { nombre: string; cantidad: number; unidad: string }[] = [];
  const meals: ('desayuno' | 'comida' | 'merienda' | 'cena')[] = ['desayuno', 'comida', 'merienda', 'cena'];
  
  meals.forEach((meal) => {
    const dishIds = dayMenu[meal] || [];
    const dayDishes = allDishes.filter((d) => dishIds.includes(d.id) || dishIds.includes(d.name));
    
    dayDishes.forEach((dish) => {
      const comensales = getPersonasEfectivasParaPlato(dish, counts, personas);
      (dish.ingredients || []).forEach((ing) => {
        const qty = (Number(ing.amount) || 0) * comensales;
        todosIngredientes.push({ nombre: ing.name, cantidad: qty, unidad: ing.unit || 'g' });
      });
    });
  });

  // ─── NUEVO: Filtrar proveedores por el año en curso ───
  const currentYear = new Date().getFullYear().toString(); // Ej: "2026"
  
  const proveedoresDelAnio = proveedores.filter((prov) => {
    // Incluye al proveedor si su campo 'fecha' existe y contiene el año actual
    // (Funciona tanto si la fecha es "2026" como si es "2026-01-01")
    return prov.fecha && String(prov.fecha).includes(currentYear);
  });

  // Usamos el array filtrado en lugar del original
  const porProveedor = agruparIngredientesPorProveedor(todosIngredientes, proveedoresDelAnio);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(campName, 14, currentY);
  currentY += 8;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Lista de Compra por Proveedor — Día ${dayMenu.day}`, 14, currentY);
  currentY += 6;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, currentY);
  currentY += 10;

  if (porProveedor.length === 0) {
    doc.setFontSize(12);
    doc.text('No hay ingredientes para este día.', 14, currentY);
  } else {
    porProveedor.forEach((grupo, idx) => {
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFillColor(234, 88, 12);
      doc.rect(14, currentY - 4, 182, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${grupo.proveedor.nombre}`, 17, currentY + 2);
      currentY += 10;

      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const datosContacto: string[] = [];
      if (grupo.proveedor.telefono) datosContacto.push(`Tel: ${grupo.proveedor.telefono}`);
      if (grupo.proveedor.email) datosContacto.push(`Email: ${grupo.proveedor.email}`);
      if (grupo.proveedor.direccion) datosContacto.push(`Dir: ${grupo.proveedor.direccion}`);
      
      if (datosContacto.length > 0) {
        doc.text(datosContacto.join('   |   '), 17, currentY);
        currentY += 5;
      }

      autoTable(doc, {
        startY: currentY,
        head: [['Ingrediente', 'Cantidad', 'Unidad']],
        body: grupo.ingredientes.map((ing: any) => {
          let nombreMostrar = ing.nombre;
          if (ing.tambienEn && ing.tambienEn.length > 0) {
            nombreMostrar += ` (también en: ${ing.tambienEn.join(', ')})`;
          }
          return [nombreMostrar, formatQty(ing.cantidad, ing.unidad), ing.unidad];
        }),
        theme: 'grid',
        headStyles: { fillColor: [251, 146, 60], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 45, halign: 'right' }, 2: { cellWidth: 30, halign: 'center' } },
        didDrawPage: (d) => { currentY = (d as any).cursor.y + 5; },
      });

      currentY += 2;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text(`Total: ${grupo.ingredientes.length} productos`, 17, currentY);
      currentY += 8;
    });
  }

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${campName} — ${new Date().toLocaleDateString('es-ES')}`, 14, doc.internal.pageSize.height - 10);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
  }

  doc.save(`Compra_Proveedores_Dia_${dayMenu.day}.pdf`);
}
