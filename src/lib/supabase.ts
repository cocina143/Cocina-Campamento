import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hbqcgliinnqjddyaxhpz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhicWNnbGlpbm5xamRkeWF4aHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODI0NzUsImV4cCI6MjEwNTU1ODQ3NX0.QV6NaFUhtEcHTH9LhQsZ1AU-o1enmS9vV56cJ6oZL3A'; // Pega aquí la clave anon public

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);