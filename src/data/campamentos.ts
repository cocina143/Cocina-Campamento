import { supabase } from '@/lib/supabase';

export interface Campamento {
  id: string;
  nombre: string;
  anio: number;
  ubicacion: string;
  notas: string;
}

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function getCampamentosFromSupabase(): Promise<Campamento[]> {
  console.log('🔍 Obteniendo campamentos de Supabase...');
  const { data, error } = await supabase
    .from('campamentos')
    .select('*')
    .order('anio', { ascending: false });

  if (error) {
    console.error('❌ Error obteniendo campamentos:', error);
    return [];
  }

  console.log('✅ Campamentos obtenidos:', data);
  return (data || []).map((c: any) => ({
    id: c.id,
    nombre: c.nombre || '',
    anio: c.anio || new Date().getFullYear(),
    ubicacion: c.ubicacion || '',
    notas: c.notas || '',
  }));
}

export async function saveCampamentoToSupabase(campamento: Campamento): Promise<void> {
  console.log('💾 Guardando campamento:', campamento);
  
  const datosAGuardar: any = {
    nombre: campamento.nombre,
    anio: campamento.anio,
    ubicacion: campamento.ubicacion,
    notas: campamento.notas,
    updated_at: new Date().toISOString(),
  };

  if (isValidUUID(campamento.id)) {
    datosAGuardar.id = campamento.id;
    console.log('📝 Es un campamento existente, ID:', campamento.id);
  } else {
    console.log('✨ Es un campamento nuevo, Supabase generará el ID');
  }

  console.log('📤 Datos a guardar:', datosAGuardar);

  const { data, error } = await supabase
    .from('campamentos')
    .upsert(datosAGuardar)
    .select();

  if (error) {
    console.error('❌ Error guardando campamento:', error);
    throw error;
  }

  console.log('✅ Campamento guardado correctamente:', data);
}

export async function deleteCampamentoFromSupabase(id: string): Promise<void> {
  console.log('🗑️ Eliminando campamento:', id);
  const { error } = await supabase
    .from('campamentos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ Error eliminando campamento:', error);
    throw error;
  }

  console.log('✅ Campamento eliminado correctamente');
}

export function getCampamentoLabel(campamento: Campamento): string {
  return `${campamento.nombre} (${campamento.anio})`;
}
