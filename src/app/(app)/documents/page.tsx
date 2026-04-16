import { DocumentLibrary } from "@/components/documents/DocumentLibrary";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Gérez vos CVs, lettres de motivation et autres documents.
        </p>
      </div>
      <div className="card">
        <DocumentLibrary />
      </div>
    </div>
  );
}
