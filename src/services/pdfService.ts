import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Dish } from '@/data/dishes';
import type { DayMenu } from '@/data/menu';
import type { SectionCounts } from '@/data/sections';
import type { Persona, TipoDieta } from '@/data/personas';
import { totalPeople } from '@/data/sections';
import { getTotalPersonasConDieta, esIncompatibleConDieta } from '@/data/personas';

interface ConsolidatedItem {
  name: string;
  amount: number;
  unit: string;
}

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
  if (unit === 'g' && rounded >= 1000) {
    return `${(rounded / 1000).toFixed(2)} kg`;
  }
  if (unit === 'ml' && rounded >= 1000) {
    return `${(rounded / 1000).toFixed(2)} L`;
  }
  return `${rounded} ${unit}`;
}

function getDietaDelPlato(dish: Dish): TipoDieta | null {
  if (dish.diets?.includes('vegano')) return 'Vegano';
  if (dish.diets?.includes('vegetariano')) return 'Vegetariano';
  const noHalal = ['cerdo', 'jamon', 'jamón', 'bacon', 'vino', 'alcohol', 'cerveza', 'ron', 'licor'];
  const tieneNoHalal = dish.ingredients?.some((ing) =>
    noHalal.some((nh) => ing.name.toLowerCase().includes(nh))
  );
  if (!tieneNoHalal && dish.name.toLowerCase().includes('halal')) return 'Halal';
  return null;
}

function getPersonasEfectivasParaPlato(dish: Dish, counts: SectionCounts, personas: Persona[]): number {
  const dietaDelPlato = getDietaDelPlato(dish);
  
  if (dietaDelPlato) {
    return getTotalPersonasConDieta(counts, personas, dietaDelPlato);
  }
  
  // Plato General: calcular para todos MENOS los que no pueden comerlo
  const total = totalPeople(counts);
  let personasQueNoPueden = 0;
  
  personas.forEach((p) => {
    if (p.dieta !== 'General' && esIncompatibleConDieta(dish, p.dieta)) {
      personasQueNoPueden++;
    }
  });
  
  return Math.max(0, total - personasQueNoPueden);
}

export function generateDailyShoppingPDF(
  dayMenu: DayMenu,
  allDishes: Dish[],
  counts: SectionCounts,
  personas: Persona[] = [],
  campName: string = 'Cocina La Milagrosa 143'
): void {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(campName, 14, 20);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Lista de la Compra — Día ${dayMenu.day}`, 14, 28);

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Comensales totales: ${totalPeople(counts)} personas`, 14, 35);

  let currentY = 44;

  const meals: { key: 'desayuno' | 'comida' | 'merienda' | 'cena'; label: string }[] = [
    { key: 'desayuno', label: 'DESAYUNO' },
    { key: 'comida', label: 'COMIDA' },
    { key: 'merienda', label: 'MERIENDA' },
    { key: 'cena', label: 'CENA' },
  ];

  meals.forEach((meal) => {
    const mealDishes = getDishesForMeal(dayMenu, meal.key, allDishes);
    if (mealDishes.length === 0) return;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text(meal.label, 14, currentY);
    currentY += 2;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    const dishNames = mealDishes.map((d) => d.name).join(', ');
    doc.text(`Platos: ${dishNames}`, 14, currentY + 4);
    currentY += 8;

    // Agrupar platos por tipo de dieta
    const platosPorDieta: Record<string, { platos: Dish[]; comensales: number }> = {};
    
    mealDishes.forEach((dish) => {
      const dieta = getDietaDelPlato(dish) || 'General';
      const comensales = getPersonasEfectivasParaPlato(dish, counts, personas);
      
      if (!platosPorDieta[dieta]) {
        platosPorDieta[dieta] = { platos: [], comensales: 0 };
      }
      platosPorDieta[dieta].platos.push(dish);
      platosPorDieta[dieta].comensales = Math.max(platosPorDieta[dieta].comensales, comensales);
    });

    // Generar tabla para cada grupo de dieta
    Object.entries(platosPorDieta).forEach(([dieta, data]) => {
      const mealIngredients = consolidateIngredients(data.platos, data.comensales);
      if (mealIngredients.length === 0) return;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(`${dieta} (${data.comensales} comensales)`, 14, currentY);
      currentY += 5;

      autoTable(doc, {
        startY: currentY,
        head: [['Ingrediente', 'Cantidad', 'Unidad']],
        body: mealIngredients.map((item) => [
          item.name,
          formatQty(item.amount, item.unit),
          item.unit,
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [251, 146, 60],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [255, 247, 237],
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 45, halign: 'right' },
          2: { cellWidth: 30, halign: 'center' },
        },
        didDrawPage: (data) => {
          currentY = data.cursor.y + 8;
        },
      });

      currentY += 4;
    });
  });

  // Resumen consolidado de todo el día
  const allDayDishes = [
    ...getDishesForMeal(dayMenu, 'desayuno', allDishes),
    ...getDishesForMeal(dayMenu, 'comida', allDishes),
    ...getDishesForMeal(dayMenu, 'merienda', allDishes),
    ...getDishesForMeal(dayMenu, 'cena', allDishes),
  ];

  // Agrupar todos los platos del día por dieta
  const todosPlatosPorDieta: Record<string, { platos: Dish[]; comensales: number }> = {};
  
  allDayDishes.forEach((dish) => {
    const dieta = getDietaDelPlato(dish) || 'General';
    const comensales = getPersonasEfectivasParaPlato(dish, counts, personas);
    
    if (!todosPlatosPorDieta[dieta]) {
      todosPlatosPorDieta[dieta] = { platos: [], comensales: 0 };
    }
    todosPlatosPorDieta[dieta].platos.push(dish);
    todosPlatosPorDieta[dieta].comensales = Math.max(todosPlatosPorDieta[dieta].comensales, comensales);
  });

  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text('RESUMEN TOTAL DEL DÍA', 14, currentY);
  currentY += 8;

  Object.entries(todosPlatosPorDieta).forEach(([dieta, data]) => {
    const globalIngredients = consolidateIngredients(data.platos, data.comensales);
    if (globalIngredients.length === 0) return;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`${dieta} (${data.comensales} comensales)`, 14, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [['Ingrediente', 'Cantidad Total', 'Unidad']],
      body: globalIngredients.map((item) => [
        item.name,
        formatQty(item.amount, item.unit),
        item.unit,
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [234, 88, 12],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
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
      didDrawPage: (data) => {
        currentY = data.cursor.y + 8;
      },
    });

    currentY += 4;
  });

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

export function generateGlobalShoppingPDF(
  menuList: DayMenu[],
  allDishes: Dish[],
  counts: SectionCounts,
  personas: Persona[] = [],
  campName: string = 'Cocina La Milagrosa 143'
): void {
  const doc = new jsPDF();
  const defaultComensales = totalPeople(counts);

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

  // Agrupar todos los platos de los 15 días por dieta
  const globalPorDieta: Record<string, { platos: Dish[]; comensales: number }> = {};

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
      
      if (!globalPorDieta[dieta]) {
        globalPorDieta[dieta] = { platos: [], comensales: 0 };
      }
      globalPorDieta[dieta].platos.push(dish);
      globalPorDieta[dieta].comensales = Math.max(globalPorDieta[dieta].comensales, comensales);
    });
  });

  let currentY = 44;

  Object.entries(globalPorDieta).forEach(([dieta, data]) => {
    const globalItems = consolidateIngredients(data.platos, data.comensales);
    if (globalItems.length === 0) return;

    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`${dieta} (${data.comensales} comensales)`, 14, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
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
      didDrawPage: (data) => {
        currentY = data.cursor.y + 8;
      },
    });

    currentY += 4;
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  if (finalY > 220) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY = finalY;
  }

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 80, 0);
  doc.text('Resumen de Menú por Día', 14, currentY);

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
    startY: currentY + 5,
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
