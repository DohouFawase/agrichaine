import Link from "next/link";

export const metadata = {
  title: "Mentions légales — Onabaya",
  description: "Mentions légales de la plateforme Onabaya.",
};

export default function MentionsLegalesPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-20">
      <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-6">
        Mentions légales
      </h1>

      <div className="flex flex-col gap-6 text-base leading-relaxed text-gray-600 dark:text-gray-400">
        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Éditeur du site
          </h2>
          <p>
            Le site Onabaya est édité par la société Onabaya SARL, immatriculée
            au RCCM de Cotonou sous le numéro BJ-COT-XXXXX-X.
          </p>
          <p className="mt-1.5">
            Siège social : Cotonou, Bénin
            <br />
            Email :{" "}
            <a
              href="mailto:contact@onabaya.bj"
              className="text-gray-900 dark:text-white underline underline-offset-2"
            >
              contact@onabaya.bj
            </a>
            <br />
            Téléphone : +229 00 00 00 00
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Directeur de la publication
          </h2>
          <p>DOHOU Gbênoupko Fawase / CEO, en qualité de Directeur de la publication.</p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Hébergement
          </h2>
          <p>
            Le site est hébergé par [Nom de l'hébergeur], dont le siège social
            est situé à [Adresse de l'hébergeur].
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Propriété intellectuelle
          </h2>
          <p>
            L&apos;ensemble du contenu du site Onabaya (textes, images, logos,
            interface, code source) est la propriété exclusive d&apos;Onabaya
            SARL, sauf mention contraire. Toute reproduction, distribution ou
            utilisation sans autorisation écrite préalable est strictement
            interdite.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Activité
          </h2>
          <p>
            Onabaya est une plateforme de mise en relation numérique dédiée au
            commerce de produits vivriers en Côte d&apos;Ivoire. Onabaya n&apos;est
            ni vendeur, ni transporteur, ni producteur. Elle agit en tant
            qu&apos;intermédiaire technique entre les parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Crédits
          </h2>
          <p>
            Icônes : Lucide Icons (licence MIT)
            <br />
            Design et développement : Équipe Onabaya
          </p>
        </section>
      </div>

      <Link
        href="/"
        className="inline-block mt-10 text-sm font-medium text-gray-900 dark:text-white underline underline-offset-4"
      >
        ← Retour à l'accueil
      </Link>
    </main>
  );
}