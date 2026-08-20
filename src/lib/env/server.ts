import "server-only";

import { parseServerEnv } from "./schema";

export function getServerEnv() {
  return parseServerEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OMIE_APP_KEY: process.env.OMIE_APP_KEY,
    OMIE_APP_SECRET: process.env.OMIE_APP_SECRET,
  });
}
