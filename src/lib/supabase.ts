import { createClient } from '@supabase/supabase-js';

// Hardcoded default values from the user's Supabase credentials to guarantee 100% immediate connectivity.
// It can also load from standard process.env or import.meta.env parameters.
const env = typeof process !== 'undefined' && process.env ? process.env : {};
const SUPABASE_URL = 
  env.SUPABASE_URL ||
  env.VITE_SUPABASE_URL ||
  'https://ecfmufpfngycoggtphrd.supabase.co';

const SUPABASE_KEY = 
  env.SUPABASE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZm11ZnBmbmd5Y29nZ3RwaHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MjIxNzYsImV4cCI6MjEwMDE5ODE3Nn0.DJ3MgNFS7fwszrt5HwdbEaNnRMRKFqjyfesDib1KU9k';

// Clean standard project URL by removing any trailing paths like '/rest/v1/' or '/'
const rawUrl = SUPABASE_URL || 'https://ecfmufpfngycoggtphrd.supabase.co';
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

export const supabase = createClient(cleanUrl, SUPABASE_KEY);
