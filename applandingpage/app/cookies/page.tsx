import { Link } from "lucide-react";

export const metadata = {
  title: "Politique de cookies — Onabaya",
  description: "Comment Onabaya utilise les cookies et traceurs.",
};

export default function CookiesPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-20">
      <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-6">
        Politique de cookies
      </h1>

      <div className="flex flex-col gap-6 text-base leading-relaxed text-gray-600 dark:text-gray-400">
        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Qu'est-ce qu'un cookie ?
          </h2>
          <p>
            Un cookie est un petit fichier texte déposé sur votre appareil lors
            de la visite d'un site. Il permet de mémoriser vos préférences et
            d'améliorer votre expérience.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Quels cookies utilisons-nous ?
          </h2>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>
              <strong className="text-gray-900 dark:text-white">
                Cookies essentiels
              </strong>{" "}
              — nécessaires au fonctionnement du site (session, sécurité).
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Cookies de préférences
              </strong>{" "}
              — mémorisent vos choix (langue, thème sombre/clair).
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Cookies analytiques
              </strong>{" "}
              — nous aident à comprendre comment le site est utilisé (Google
              Analytics, etc.).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Comment gérer vos cookies ?
          </h2>
          <p>
            Vous pouvez à tout moment modifier votre choix en cliquant sur le
            lien "Gérer les cookies" en bas de page, ou directement depuis les
            paramètres de votre navigateur.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Durée de conservation
          </h2>
          <p>
            Votre choix (accepter / refuser) est conservé pendant 6 mois dans
            votre navigateur via localStorage. Passé ce délai, la bannière
            réapparaîtra.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Contact
          </h2>
          <p>
            Pour toute question :{" "}
            <a
              href="mailto:contact@onabaya.ci"
              className="text-gray-900 dark:text-white underline underline-offset-2"
            >
              contact@onabaya.ci
            </a>
          </p>
        </section>
      </div>

      {/* Lien de retour */}
      <Link
        href="/"
        className="inline-block mt-10 text-sm font-medium text-gray-900 dark:text-white underline underline-offset-4"
      >
        ← Retour à l'accueil
      </Link>
    </main>
  );
}