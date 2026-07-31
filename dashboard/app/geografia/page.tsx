export const dynamic = "force-dynamic";

import { getGastoPorRegion } from "@/lib/queries";
import { GeografiaClient } from "./client";

export default async function GeografiaPage() {
  const regiones = await getGastoPorRegion().catch(() => []);
  return <GeografiaClient data={regiones} />;
}
