import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Dish } from '@/data/dishes';
import type { DayMenu } from '@/data/menu';
import type { SectionCounts } from '@/data/sections';
import { totalPeople } from '@/data/sections';

// ─── Tipos internos ───────────────────────────────────────────────
interface ConsolidatedItem {
  name: string;
  amount: number;
  unit: string;
}

// ─── Helper: consolidar ingredientes de una lista de platos ──────
function consolidateIngredients(
  dishes: Dish[],
  comensales: number
): ConsolidatedItem[] {
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
        map.set(key, {
          name: cleanName,
          amount: qty * comensales,
          unit: ing.unit || 'g',
        });
      }
    });
  });

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

// ─── Helper: obtener platos de un día concreto ───────────────────
function getDishesForDay(dayMenu: DayMenu, allDishes: Dish[]): Dish[] {
  const ids = new Set([
    ...(dayMenu.desayuno || []),
    ...(dayMenu.comida || []),
    ...(dayMenu.merienda || []),
    ...(dayMenu.cena || []),
  ]);

  return allDishes.filter((d) => ids.has(d.id) || ids.has(d.name));
}

// ─── Helper: formatear cantidad legible ──────────────────────────
function formatQty(amount: number, unit: string): string {
  const rounded = Math.round(amount * 100) / 100;
  if (unit === 'g' && rounded >= 1000) {
    return `${(rounded / 1000).toFixed(2)} kg`;
  }
  if (unit === 'ml' && rounded >= 1000) {
    return `${(rounded / 1000).toFixed(2)} L`;
  }
  return `${rounded} ${unit}`;
}

// ═══════════════════════════════════════════════════════════════════
//  GENERAR PDF DE UN DÍA
// ═══════════════════════════════════════════════════════════════════
export function generateDailyShoppingPDF(
  dayMenu: DayMenu,
  allDishes: Dish[],
  counts: SectionCounts,
  campName: string = 'Cocina La Milagrosa 143'
): void {
  const doc = new jsPDF();
  const comensales = totalPeople(counts);
  const dayDishes = getDishesForDay(dayMenu, allDishes);
  const items = consolidateIngredients(dayDishes, comensales);

  // ── Cabecera ──
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(campName, 14, 20);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Lista de la Compra — Día ${dayMenu.day}`, 14, 28);

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Comensales: ${comensales} personas`, 14, 35);

  // ── Menú del día ──
  let y = 44;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 80, 0);
  doc.text('Menú del día:', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);

  const meals: { label: string; items: string[] }[] = [
    { label: 'Desayuno', items: dayMenu.desayuno || [] },
    { label: 'Comida', items: dayMenu.comida || [] },
    { label: 'Merienda', items: dayMenu.merienda || [] },
    { label: 'Cena', items: dayMenu.cena || [] },
  ];

  meals.forEach((meal) => {
    if (meal.items.length > 0) {
      doc.text(`  ${meal.label}: ${meal.items.join(', ')}`, 14, y);
      y += 5;
    }
  });

  y += 6;

  // ── Tabla de ingredientes ──
  autoTable(doc, {
    startY: y,
    head: [['Ingrediente', 'Cantidad', 'Unidad']],
    body: items.map((item) => [
      item.name,
      formatQty(item.amount, item.unit),
      item.unit,
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [255, 247, 237],
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 45, halign: 'right' },
      2: { cellWidth: 30, halign: 'center' },
    },
  });

  // ── Pie de página ──
  const pageCount = (doc as any).lastAutoTable.pageCount || 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${campName} — Generado el ${new Date().toLocaleDateString('es-ES')}`,
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`Compra_Dia_${dayMenu.day}.pdf`);
}

// ═══════════════════════════════════════════════════════════════════
//  GENERAR PDF GLOBAL (15 DÍAS)
// ═══════════════════════════════════════════════════════════════════
export function generateGlobalShoppingPDF(
  menuList: DayMenu[],
  allDishes: Dish[],
  counts: SectionCounts,
  campName: string = 'Cocina La Milagrosa 143'
): void {
  const doc = new jsPDF();
  const defaultComensales = totalPeople(counts);

  // ── Cabecera ──
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(campName, 14, 20);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Lista de la Compra Global — 15 Días', 14, 28);

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Comensales base: ${defaultComensales} personas`, 14, 35);

  // ── Consolidar TODOS los ingredientes de los 15 días ──
  const globalMap = new Map<string, ConsolidatedItem>();

  menuList.forEach((dayMenu) => {
    const dayDishes = getDishesForDay(dayMenu, allDishes);
    dayDishes.forEach((dish) => {
      (dish.ingredients || []).forEach((ing) => {
        const cleanName = ing.name ? ing.name.trim() : '';
        if (!cleanName) return;
        const key = `${cleanName.toLowerCase()}_${ing.unit.toLowerCase()}`;
        const qty = Number(ing.amount) || 0;

        if (globalMap.has(key)) {
          globalMap.get(key)!.amount += qty * defaultComensales;
        } else {
          globalMap.set(key, {
            name: cleanName,
            amount: qty * defaultComensales,
            unit: ing.unit || 'g',
          });
        }
      });
    });
  });

  const globalItems = Array.from(globalMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // ── Tabla principal ──
  autoTable(doc, {
    startY: 44,
    head: [['Ingrediente', 'Cantidad Total (15 días)', 'Unidad']],
    body: globalItems.map((item) => [
      item.name,
      formatQty(item.amount, item.unit),
      item.unit,
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [255, 247, 237],
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 50, halign: 'right' },
      2: { cellWidth: 30, halign: 'center' },
    },
  });

  // ── Resumen por día (segunda sección) ──
  const finalY = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 80, 0);
  doc.text('Resumen de Menú por Día', 14, finalY);

  const resumenRows: string[][] = menuList.map((dayMenu) => {
    const allMeals = [
      ...(dayMenu.desayuno || []),
      ...(dayMenu.comida || []),
      ...(dayMenu.merienda || []),
      ...(dayMenu.cena || []),
    ];
    return [
      `Día ${dayMenu.day}`,
      allMeals.join(', ') || 'Sin asignar',
      String(defaultComensales),
    ];
  });

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Día', 'Platos', 'Comensales']],
    body: resumenRows,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 37, 36],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 120 },
      2: { cellWidth: 25, halign: 'center' },
    },
  });

  // ── Pie de página ──
  const pageCount = (doc as any).lastAutoTable.pageCount || 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${campName} — Generado el ${new Date().toLocaleDateString('es-ES')}`,
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`Compra_Global_15_Dias.pdf`);
}
