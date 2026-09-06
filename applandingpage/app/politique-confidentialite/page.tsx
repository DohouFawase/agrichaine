import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité — Onabaya",
  description:
    "Comment Onabaya collecte, utilise et protège vos données personnelles.",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-20">
      <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-6">
        Politique de confidentialité
      </h1>

      <div className="flex flex-col gap-6 text-base leading-relaxed text-gray-600 dark:text-gray-400">
        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            1. Qui sommes-nous ?
          </h2>
          <p>
            Onabaya SARL est une société immatriculée en Côte d&apos;Ivoire,
            exploitant la plateforme Onabaya. Nous sommes le responsable du
            traitement de vos données personnelles.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            2. Quelles données collectons-nous ?
          </h2>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>
              <strong className="text-gray-900 dark:text-white">
                Données d&apos;inscription
              </strong>{" "}
              — nom, email, numéro de téléphone, ville, rôle (producteur,
              acheteur, transporteur).
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Données de profil
              </strong>{" "}
              — photo, description, notes et avis laissés par les autres
              utilisateurs.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Données de transaction
              </strong>{" "}
              — historique des commandes, paiements, litiges.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Données de localisation
              </strong>{" "}
              — position GPS lors du suivi de livraison (avec votre
              consentement).
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Données techniques
              </strong>{" "}
              — adresse IP, type de navigateur, appareil, cookies.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            3. Pourquoi collectons-nous ces données ?
          </h2>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Fournir et améliorer nos services</li>
            <li>Assurer la sécurité des transactions</li>
            <li>Permettre le suivi des livraisons en temps réel</li>
            <li>Communiquer avec vous (notifications, support)</li>
            <li>Respecter nos obligations légales</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            4. Qui a accès à vos données ?
          </h2>
          <p>
            Vos données sont strictement confidentielles. Elles ne sont
            accessibles qu&apos;à :
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-1.5">
            <li>L&apos;équipe Onabaya (administration, support technique)</li>
            <li>
              Les autres utilisateurs, uniquement les informations nécessaires à
              la transaction (nom, ville, note)
            </li>
            <li>
              Nos prestataires techniques (hébergement, paiement Mobile Money),
              sous contrat de confidentialité
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            5. Combien de temps conservons-nous vos données ?
          </h2>
          <p>
            Vos données sont conservées aussi longtemps que votre compte est
            actif. En cas de suppression de compte, vos données sont anonymisées
            ou supprimées dans un délai de 12 mois, sauf obligation légale
            contraire (ex : facturation).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            6. Vos droits
          </h2>
          <p>
            Conformément à la législation en vigueur, vous disposez des droits
            suivants :
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-1.5">
            <li>
              <strong className="text-gray-900 dark:text-white">
                Droit d&apos;accès
              </strong>{" "}
              — savoir quelles données nous détenons sur vous
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Droit de rectification
              </strong>{" "}
              — corriger des informations inexactes
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Droit à l&apos;effacement
              </strong>{" "}
              — demander la suppression de vos données
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Droit à la portabilité
              </strong>{" "}
              — récupérer vos données dans un format structuré
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Droit d&apos;opposition
              </strong>{" "}
              — vous opposer à certains traitements
            </li>
          </ul>
          <p className="mt-1.5">
            Pour exercer ces droits, contactez-nous à :{" "}
            <a
              href="mailto:privacy@onabaya.ci"
              className="text-gray-900 dark:text-white underline underline-offset-2"
            >
              privacy@onabaya.ci
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            7. Sécurité
          </h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles
            pour protéger vos données : chiffrement SSL, authentification
            sécurisée, sauvegardes régulières, accès restreint aux données
            sensibles.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            8. Modifications
          </h2>
          <p>
            Cette politique peut être mise à jour à tout moment. Les
            modifications significatives vous seront notifiées par email ou via
            l&apos;application.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            9. Contact
          </h2>
          <p>
            Pour toute question relative à vos données :{" "}
            <a
              href="mailto:privacy@onabaya.ci"
              className="text-gray-900 dark:text-white underline underline-offset-2"
            >
              privacy@onabaya.ci
            </a>
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
