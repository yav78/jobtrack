export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Bienvenue sur Jobtrack</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Utilisez la navigation pour gérer vos entreprises, contacts, opportunités et entretiens.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold">Prochaines étapes</h2>
          <ul className="mt-2 space-y-1 text-sm text-neutral-700 dark:text-neutral-200">
            <li>• Configurer la base de données (Docker compose)</li>
            <li>• Définir le schéma Prisma</li>
            <li>• Implémenter les endpoints API</li>
          </ul>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold">Raccourcis</h2>
          <ul className="mt-2 space-y-1 text-sm text-neutral-700 dark:text-neutral-200">
            <li>• Entreprises : /companies</li>
            <li>• Contacts : /contacts</li>
            <li>• Opportunités : /opportunities</li>
            <li>• Entretiens : /entretiens/new</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
