export const dynamic = "force-dynamic";

import { getTopProveedores } from "@/lib/queries";
import { ProveedoresClient } from "./client";

export default async function ProveedoresPage() {
  const proveedores = await getTopProveedores(15).catch(() => []);
  return <ProveedoresClient data={proveedores} />;
}
