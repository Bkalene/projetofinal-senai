import { createClient } from '@supabase/supabase-js';

// Requisito: A aplicação precisa das credenciais do Supabase. 
// Use os valores reais no .env.local para fazer o pipeline funcionar.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jauoggkcffjoknxxeufx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_H_8OKf7rm5V8eB91RquXPw_gpB6iCx9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
