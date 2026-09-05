/* eslint-disable @next/next/no-img-element */

const roleCards = [
  {
    id: "producteur",
    title: "Vendez sans intermédiaire",
    tag: "Producteur",
    image: "https://placehold.co/400x250?text=Producteur",
    description:
      "Publiez vos produits en quelques photos, fixez votre prix, et recevez des commandes directement depuis votre téléphone. Vous êtes payé de manière sécurisée, sans passer par un revendeur qui rogne votre marge.",
  },
  {
    id: "acheteur",
    title: "Achetez en toute confiance",
    tag: "Acheteur",
    image: "https://placehold.co/400x250?text=Acheteur",
    description:
      "Parcourez les produits disponibles près de chez vous, commandez en quelques clics, payez via Mobile Money (MTN MoMo), et suivez votre livraison en temps réel sur la carte — jusqu'à la remise en main propre.",
  },
  {
    id: "transporteur",
    title: "Transportez et gagnez",
    tag: "Transporteur",
    image: "https://placehold.co/400x250?text=Transporteur",
    description:
      "Consultez les trajets disponibles, proposez votre capacité de transport (poids, ville de départ, ville d'arrivée), acceptez les courses qui vous arrangent, et soyez payé pour chaque livraison effectuée.",
  },
];

export default function HowItWorksSection() {
  const offsets = ["mt-0", "md:mt-10", "md:mt-20"];

  return (
    <section className="py-20 px-4">
      <div className="">
        <h2 className="text-[26px] font-medium text-gray-900 dark:text-white text-center mb-12">
          Une app, trois façons d&apos;en profiter
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {roleCards.map((role, i) => (
            <div
              key={role.id}
              className={`relative rounded-[20px] border  dark:border-white overflow-hidden hover:shadow bg-white dark:bg-gray-900 ${offsets[i]}`}
            >
              {/* Numéro filigrane géant */}
              <span className="absolute -top-3 left-4 text-[80px] font-medium leading-none text-gray-200 dark:text-gray-800 opacity-60 tabular-nums pointer-events-none z-0 select-none">
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Image + tag */}
              <div className="relative z-10 h-[180px]  dark:border-white overflow-hidden">
                <img
                  src={role.image}
                  alt={role.tag}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 right-3 text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900">
                  {role.tag}
                </span>
              </div>

              {/* Contenu */}
              <div className="relative z-10 p-5">
                <h3 className="text-[17px] font-medium text-gray-900 dark:text-white mb-2.5">
                  {role.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
                  {role.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}