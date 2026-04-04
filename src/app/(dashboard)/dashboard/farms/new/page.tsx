import { requireTenantSession } from "@/lib/auth/session";
import { getWUMs } from "@/lib/wum/service";
import { CreateFarmForm } from "@/components/farm/create-farm-form";
import { redirect } from "next/navigation";

export const metadata = { title: "Nuevo Predio" };

export default async function NewFarmPage() {
  const session = await requireTenantSession();
  const wums = await getWUMs(session.tenantId);

  // Must have at least one WUM to create a farm
  if (wums.length === 0) {
    redirect("/dashboard/wum/new");
  }

  return (
    <div className="mx-auto max-w-3xl py-4">
      <CreateFarmForm
        wums={wums.map((w) => ({ id: w.id, name: w.name }))}
      />
    </div>
  );
}
