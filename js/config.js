const VELO_CONFIG = {
  SUPABASE_URL: "YOUR_SUPABASE_PROJECT_URL",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
};

const supabaseClient = window.supabase.createClient(
  VELO_CONFIG.SUPABASE_URL,
  VELO_CONFIG.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
