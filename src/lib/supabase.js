import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://YOUR_PROJECT_REF.supabase.co",
  "REDACTED_SUPABASE_ANON_KEY"
);
