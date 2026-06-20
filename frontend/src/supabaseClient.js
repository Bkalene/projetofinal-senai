import { createClient } from '@supabase/supabase-js';

// Requisito: A aplicação precisa das credenciais do Supabase. 
// Use os valores reais no .env.local para fazer o pipeline funcionar.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
