import { CreateOrganizationForm } from "@/components/tenant/create-organization-form";

export const metadata = {
  title: "Nueva Organización",
};

export default function NewOrganizationPage() {
  return (
    <div className="mx-auto max-w-lg py-8">
      <CreateOrganizationForm />
    </div>
  );
}
