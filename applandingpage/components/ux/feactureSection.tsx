import {
  CreditCard,
  MapPin,
  QrCode,
  Bell,
  UserCheck,
  Truck,
} from "lucide-react";

const features = [
  {
    id: "paiement-securise",
    title: "Paiement sécurisé par Mobile Money (MTN MoMo)",
    description:
      "L'argent de l'acheteur est mis en garantie dès la commande et n'est libéré au producteur qu'une fois la livraison confirmée. Personne n'est lésé.",
    icon: CreditCard,
    span: "md:col-span-2",
  },
  {
    id: "suivi-livraison",
    title: "Suivi de livraison en temps réel",
    description:
      "Une carte interactive montre la position du transporteur, du départ jusqu'à l'arrivée.",
    icon: MapPin,
    span: "md:col-span-1",
  },
  {
    id: "verification-qr",
    title: "Vérification par QR code",
    description:
      "Chaque commande est validée à la remise grâce à un QR code unique, pour éviter les litiges et les erreurs de livraison.",
    icon: QrCode,
    span: "md:col-span-1",
  },
  {
    id: "notifications",
    title: "Notifications en temps réel",
    description:
      "Commande reçue, en préparation, en route, livrée — vous êtes informé à chaque étape.",
    icon: Bell,
    span: "md:col-span-1",
  },
  {
    id: "profils-verifies",
    title: "Profils vérifiés et notés",
    description:
      "Chaque utilisateur a un profil avec une note moyenne, basée sur les échanges précédents, pour construire la confiance.",
    icon: UserCheck,
    span: "md:col-span-1",
  },
  {
    id: "suivi-trajets",
    title: "Suivi des trajets pour les transporteurs",
    description:
      "Possibilité d'indiquer un trajet à l'avance (ville de départ, ville d'arrivée, capacité disponible, date) pour optimiser chaque voyage plutôt que de rouler à vide.",
    icon: Truck,
    span: "md:col-span-2",
  },
];

export default function FeatureSection() {
  return (
    <section id="features" className="py-16 ">
      <div className="">
        <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-8">
          Pensé pour rassurer, pas seulement pour vendre
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className={`${feature.span} hover:shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col gap-3`}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-900 dark:text-white">
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <h3 className=" text-xl font-medium text-gray-900 dark:text-white leading-snug">
                  {feature.title}
                </h3>
                <p className="  text-md leading-relaxed text-gray-500 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}