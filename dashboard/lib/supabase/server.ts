/**
 * Cliente Supabase para Server Components.
 * Usa las env vars que se configuran en Vercel / .env.local.
 *
 * Documentación: https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Cliente para uso en Server Components (read-only).
 * - Hace fetch en el servidor (no expone keys al cliente)
 * - Usa anon key (RLS enforced si está activado)
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components no pueden set cookies.
            // Se ignora — para auth flows usar middleware o Server Actions.
          }
        },
      },
    },
  );
}
