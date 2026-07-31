export const dynamic = "force-dynamic";

import { getHHITop30 } from "@/lib/queries";
import { ConcentracionClient } from "./client";

export default async function ConcentracionPage() {
  const data = await getHHITop30().catch(() => []);
  return <ConcentracionClient data={data} />;
}
