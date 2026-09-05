export default function ProblemSection() {
  const problems = [
    {
      num: "01",
      title: "Producteurs lésés",
      desc: "Les récoltes sont bradées faute d'acheteurs directs. Le manque de visibilité sur la demande réelle pousse à vendre à perte.",
    },
    {
      num: "02",
      title: "Acheteurs surtaxés",
      desc: "Produits qui ont transité par trop d'intermédiaires, perdant en fraîcheur et en qualité tout en coûtant plus cher.",
    },
    {
      num: "03",
      title: "Transport opaque",
      desc: "Retards, marchandises perdues, aucune traçabilité. Le transport reste le maillon faible sans aucun recours possible.",
    },
  ];

  return (
    <section className="py-20 ">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Colonne gauche — texte sticky */}
        <div className="md:sticky md:top-8">
          <h2 className="text-[28px] font-medium text-gray-900 dark:text-white leading-tight mb-4">
            Le vivrier mérite mieux qu&apos;un système cassé
          </h2>
          <p className="text-[15px] leading-relaxed text-gray-500 dark:text-gray-400 mb-4">
            Chaque jour, des producteurs bradent leurs récoltes faute d&apos;acheteurs
            fiables. Des acheteurs paient trop cher des produits qui ont déjà
            perdu en fraîcheur après être passés entre trop de mains. Et entre les
            deux, le transport reste le maillon faible : retards, marchandises
            perdues, aucune traçabilité.
          </p>
          <span className="inline-block text-sm font-medium text-gray-900 dark:text-white pl-4 pr-4 py-2.5 border-l-[3px] border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-800 rounded-r-lg">
            Résultat : tout le monde perd, sauf les intermédiaires.
          </span>
        </div>

        {/* Colonne droite — cartes numérotées */}
        <div className="flex flex-col gap-4">
          {problems.map((p) => (
            <div
              key={p.num}
              className="relative border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-white dark:bg-gray-900 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gray-900/10 dark:bg-white/10" />
              <div className="text-[32px] font-medium text-gray-200 dark:text-gray-700 leading-none mb-2 tabular-nums">
                {p.num}
              </div>
              <h4 className="text-[15px] font-medium text-gray-900 dark:text-white mb-1.5">
                {p.title}
              </h4>
              <p className="text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}