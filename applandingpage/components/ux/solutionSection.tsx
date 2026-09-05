const steps = [
  {
    id: "producteur",
    title: "Producteur",
    desc: "Publie, fixe son prix, reçoit les commandes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: "transporteur",
    title: "Transporteur",
    desc: "Accepte le trajet, suit la livraison en temps réel",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "acheteur",
    title: "Acheteur",
    desc: "Commande, paie sécurisé, reçoit en main propre",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function SolutionSection() {
  return (
    <section className="py-20">
      <div className=" grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Colonne gauche — texte */}
        <div>
          <h2 className="text-[32px] font-medium text-gray-900 dark:text-white leading-tight mb-5">
            Onabaya remet chacun à sa juste place
          </h2>
          <p className="text-[15px] leading-relaxed text-gray-500 dark:text-gray-400 mb-4">
            Chaque jour, des producteurs bradent leurs récoltes faute d&apos;acheteurs
            fiables. Des acheteurs paient trop cher des produits qui ont déjà
            perdu en fraîcheur après être passés entre trop de mains. Et entre les
            deux, le transport reste le maillon faible : retards, marchandises
            perdues, aucune traçabilité.
          </p>
          <p className="text-[15px] leading-relaxed text-gray-900 dark:text-white p-5 border-[1.5px] border-gray-900 dark:border-white rounded-[14px] bg-white dark:bg-gray-900">
            Onabaya est une application mobile qui met en relation directe trois
            acteurs essentiels : le producteur qui cultive, l&apos;acheteur qui
            commande, et le transporteur qui livre. Chaque commande est suivie en
            temps réel, chaque paiement est sécurisé, et chaque livraison est
            vérifiée. Simple, transparent, sans surprise.
          </p>
        </div>

        {/* Colonne droite — circuit vertical */}
        <div className="relative flex flex-col">
          {/* Ligne verticale */}
          <div className="absolute left-[27px] top-10 bottom-10 w-[1.5px] bg-gray-200 dark:bg-gray-800" />

          {/* Flèches entre les étapes */}
          <div className="absolute left-[22px] top-[78px] w-3 h-3 z-10">
            <svg viewBox="0 0 12 12" className="w-full h-full fill-gray-900 dark:fill-white">
              <polygon points="6,12 0,0 12,0" />
            </svg>
          </div>
          <div className="absolute left-[22px] top-[170px] w-3 h-3 z-10">
            <svg viewBox="0 0 12 12" className="w-full h-full fill-gray-900 dark:fill-white">
              <polygon points="6,12 0,0 12,0" />
            </svg>
          </div>

          {steps.map((step) => (
            <div key={step.id} className="relative z-[1] flex items-start gap-4 py-[18px]">
              <div className="w-14 h-14 rounded-full border-[1.5px] border-gray-900 dark:border-white bg-white dark:bg-gray-900 flex items-center justify-center flex-shrink-0 text-gray-900 dark:text-white">
                {step.icon}
              </div>
              <div className="pt-1.5">
                <h4 className="text-[15px] font-medium text-gray-900 dark:text-white mb-1">
                  {step.title}
                </h4>
                <p className="text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}