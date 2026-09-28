import { supabase } from '@/lib/supabase';

// ─── Tipos ─────────────────────────────────────────────────────
export type EspecialidadProveedor = 
  | 'carnes' 
  | 'pescados' 
  | 'verduras' 
  | 'lacteos' 
  | 'panaderia' 
  | 'seco' 
  | 'congelados' 
  | 'bebidas' 
  | 'limpieza' 
  | 'otros';

export const ESPECIALIDADES: { id: EspecialidadProveedor; label: string; icon: string }[] = [
  { id: 'carnes', label: 'Carnes', icon: '🥩' },
  { id: 'pescados', label: 'Pescados', icon: '🐟' },
  { id: 'verduras', label: 'Verduras y Frutas', icon: '🥬' },
  { id: 'lacteos', label: 'Lácteos y Huevos', icon: '🥛' },
  { id: 'panaderia', label: 'Panadería', icon: '🥖' },
  { id: 'seco', label: 'Despensa / Secos', icon: '🍝' },
  { id: 'congelados', label: 'Congelados', icon: '🧊' },
  { id: 'bebidas', label: 'Bebidas', icon: '🥤' },
  { id: 'limpieza', label: 'Limpieza', icon: '🧹' },
  { id: 'otros', label: 'Otros', icon: '📦' },
];

export interface Proveedor {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  especialidades: EspecialidadProveedor[]; // Array de especialidades
  direccion: string;
  notas: string;
  campamentos: string[]; // Array de UUIDs de campamentos
}

// ─── Función para verificar si un string es un UUID válido ────
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// ─── Funciones CRUD ────────────────────────────────────────────

export async function getProveedoresFromSupabase(): Promise<Proveedor[]> {
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .order('nombre');

  if (error) {
    console.error('❌ Error obteniendo proveedores de Supabase:', error);
    return [];
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    nombre: p.nombre || '',
    telefono: p.telefono || '',
    email: p.email || '',
    especialidades: Array.isArray(p.especialidades) 
      ? p.especialidades.filter((e: string) => ESPECIALIDADES.some(esp => esp.id === e))
      : ['otros'],
    direccion: p.direccion || '',
    notas: p.notas || '',
    campamentos: Array.isArray(p.campamentos) ? p.campamentos : [],
  }));
}

export async function saveProveedorToSupabase(proveedor: Proveedor): Promise<void> {
  const datosAGuardar: any = {
    nombre: proveedor.nombre,
    telefono: proveedor.telefono,
    email: proveedor.email,
    especialidades: proveedor.especialidades || ['otros'],
    direccion: proveedor.direccion,
    notas: proveedor.notas,
    campamentos: proveedor.campamentos || [],
    updated_at: new Date().toISOString(),
  };

  if (isValidUUID(proveedor.id)) {
    datosAGuardar.id = proveedor.id;
  }

  const { error } = await supabase
    .from('proveedores')
    .upsert(datosAGuardar);

  if (error) {
    console.error(`❌ Error guardando proveedor "${proveedor.nombre}":`, error);
    throw error;
  }
}

export async function deleteProveedorFromSupabase(id: string): Promise<void> {
  const { error } = await supabase
    .from('proveedores')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`❌ Error eliminando proveedor:`, error);
    throw error;
  }
}

// ─── Helpers ───────────────────────────────────────────────────

export function getProveedoresPorEspecialidad(
  proveedores: Proveedor[],
  especialidad: EspecialidadProveedor
): Proveedor[] {
  return proveedores.filter((p) => p.especialidades.includes(especialidad));
}

export function getProveedoresPorCampamento(
  proveedores: Proveedor[],
  campamentoId: string
): Proveedor[] {
  return proveedores.filter((p) => p.campamentos.includes(campamentoId));
}

export function getEspecialidadLabel(especialidad: EspecialidadProveedor): string {
  const esp = ESPECIALIDADES.find((e) => e.id === especialidad);
  return esp ? `${esp.icon} ${esp.label}` : especialidad;
}
