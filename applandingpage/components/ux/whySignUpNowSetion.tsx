const advantages = [
  {
    number: "01",
    title: "Accès prioritaire",
    description:
      "Les 100 premiers inscrits testent l'application avant son lancement officiel.",
  },
  {
    number: "02",
    title: "Vous façonnez le produit",
    description:
      "Vos retours d'utilisation orienteront directement les améliorations avant la sortie publique.",
  },
  {
    number: "03",
    title: "Avantage de lancement",
    description:
      "Les tout premiers utilisateurs bénéficieront d'un statut ou d'avantages réservés aux membres fondateurs (à annoncer).",
  },
  {
    number: "04",
    title: "Zéro engagement",
    description:
      "S'inscrire ne coûte rien et ne vous engage à rien. Vous serez simplement prévenu dès que l'app est prête à être testée.",
  },
];

export default function WhySignUpNowSection() {
  return (
    <section id="pourquoi-sinscrire" className="why-sign-up-now-section">
      <h2>Pourquoi rejoindre la liste d&apos;attente aujourd&apos;hui</h2>

      <ol className="why-sign-up-now-list">
        {advantages.map((advantage) => (
          <li key={advantage.number} className="why-sign-up-now-item">
            <span className="why-sign-up-now-number">{advantage.number}</span>
            <div className="why-sign-up-now-content">
              <h3>{advantage.title}</h3>
              <p>{advantage.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}