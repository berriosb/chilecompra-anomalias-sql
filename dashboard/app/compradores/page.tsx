export const dynamic = "force-dynamic";

import { getTopCompradores } from "@/lib/queries";
import { CompradoresClient } from "./client";

/**
 * Página: Top compradores.
 * Server Component que hace fetch a Supabase,
 * pasa los datos al Client Component para los gráficos.
 */
export default async function CompradoresPage() {
  const compradores = await getTopCompradores(15).catch(() => []);
  return <CompradoresClient data={compradores} />;
}
