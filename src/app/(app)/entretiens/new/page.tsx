import { EntretienForm } from "@/components/entretiens/EntretienForm";

export default function NewEntretienPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nouvel entretien</h1>
      <div className="card">
        <EntretienForm />
      </div>
    </div>
  );
}

