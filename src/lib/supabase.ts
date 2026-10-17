import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || 'placeholder';

// Client for browser use
export const supabase = createClient(supabaseUrl, supabasePublishableKey);

// Client for server use only.
// NEVER import supabaseAdmin in client components as it uses the secret key.
export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);
