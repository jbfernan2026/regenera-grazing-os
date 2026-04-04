import { CreateWUMForm } from "@/components/wum/create-wum-form";

export const metadata = {
  title: "Nuevo Entero Bajo Manejo",
};

export default function NewWUMPage() {
  return (
    <div className="mx-auto max-w-2xl py-4">
      <CreateWUMForm />
    </div>
  );
}
