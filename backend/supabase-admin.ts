import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabaseAdminConfig = Boolean(supabaseUrl && supabaseServiceRoleKey);

export const supabaseAdmin =
  hasSupabaseAdminConfig && supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

export function getBearerToken(authorizationHeader?: string | null) {
  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function getAuthenticatedSupabaseUser(authorizationHeader?: string | null) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin is not configured");
  }

  const accessToken = getBearerToken(authorizationHeader);
  if (!accessToken) {
    throw new Error("Missing Supabase access token");
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error("Invalid Supabase access token");
  }

  return {
    accessToken,
    user: data.user,
  };
}
