import Link from "next/link";

export const metadata = {
  title: "Conditions d'utilisation — Onabaya",
  description: "Conditions générales d'utilisation de la plateforme Onabaya.",
};

export default function CGUPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-20">
      <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-6">
        Conditions d&apos;utilisation
      </h1>

      <div className="flex flex-col gap-6 text-base leading-relaxed text-gray-600 dark:text-gray-400">
        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            1. Objet
          </h2>
          <p>
            Les présentes conditions d&apos;utilisation régissent l&apos;accès
            et l&apos;utilisation de la plateforme Onabaya, qui met en relation
            des producteurs, acheteurs et transporteurs de produits vivriers en
            Côte d&apos;Ivoire. En utilisant le site, vous acceptez ces
            conditions sans réserve.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            2. Inscription et compte
          </h2>
          <p>
            L&apos;utilisation de certaines fonctionnalités nécessite la
            création d&apos;un compte. Vous vous engagez à fournir des
            informations exactes, à jour et complètes. Vous êtes responsable de
            la confidentialité de vos identifiants et de toute activité
            effectuée sous votre compte.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-gray-900 dark:text-white mb-2">
            3. Rôles des utilisateurs
          </h2>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>
              <strong className="text-gray-900 dark:text-white">
                Producteur
              </strong>{" "}
              — publie des produits, fixe ses prix, honore les commandes
              validées.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Acheteur
              </strong>{" "}
              — parcourt les offres, passe des commandes, effectue le paiement
              sécurisé.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Transporteur
              </strong>{" "}
              — propose ses trajets, assure la livraison des marchandises.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-gray-900 dark:text-white mb-2">
            4. Paiement et sécurisation
          </h2>
          <p>
            Les paiements s&apos;effectuent via Mobile Money (MTN MoMo).
            L&apos;argent est bloqué en garantie jusqu&apos;à la confirmation de
            la livraison par l&apos;acheteur. Onabaya prélève une commission sur
            chaque transaction, dont le taux est affiché avant validation de la
            commande.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-gray-900 dark:text-white mb-2">
            5. Obligations des utilisateurs
          </h2>
          <p>
            Vous vous interdisez de : publier des informations fausses ou
            trompeuses ; vendre des produits illégaux ou dangereux ; harceler,
            menacer ou nuire à d&apos;autres utilisateurs ; contourner les
            systèmes de sécurité de la plateforme ; utiliser Onabaya à des fins
            autres que celles prévues.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-gray-900 dark:text-white mb-2">
            6. Livraison et litiges
          </h2>
          <p>
            Le transporteur est responsable de la livraison dans les délais
            convenus. En cas de retard, de marchandise endommagée ou non
            conforme, l&apos;acheteur dispose de 24 heures après réception pour
            ouvrir un litige via l&apos;application. Onabaya se réserve le droit
            d&apos;arbitrer les conflits selon les preuves disponibles (QR code,
            suivi GPS, photos).
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-gray-900 dark:text-white mb-2">
            7. Responsabilité
          </h2>
          <p>
            Onabaya est une plateforme d&apos;intermédiation. Nous ne sommes pas
            propriétaires des produits vendus ni employeurs des transporteurs.
            Nous ne garantissons pas la qualité des produits ni la ponctualité
            des livraisons, mais nous mettons en place des outils (notation,
            vérification, paiement sécurisé) pour réduire les risques.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-gray-900 dark:text-white mb-2">
            8. Données personnelles
          </h2>
          <p>
            Vos données sont collectées et traitées conformément à notre
            Politique de confidentialité. Vous disposez d&apos;un droit
            d&apos;accès, de rectification et de suppression sur simple demande.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-gray-900 dark:text-white mb-2">
            9. Modification des conditions
          </h2>
          <p>
            Onabaya se réserve le droit de modifier les présentes conditions à
            tout moment. Les utilisateurs seront informés des changements
            significatifs. L&apos;utilisation continue de la plateforme vaut
            acceptation des nouvelles conditions.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-gray-900 dark:text-white mb-2">
            10. Droit applicable
          </h2>
          <p>
            Les présentes conditions sont régies par le droit ivoirien. Tout
            litige sera soumis aux juridictions compétentes d&apos;Abidjan.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-gray-900 dark:text-white mb-2">
            11. Contact
          </h2>
          <p>
            Pour toute question relative aux présentes conditions :{" "}
            <a
              href="mailto:contact@onabaya.ci"
              className="text-gray-900 dark:text-white underline underline-offset-2"
            >
              contact@onabaya.ci
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
