const features = [
  {
    id: "paiement-securise",
    title: "Paiement sécurisé par Mobile Money (MTN MoMo)",
    description:
      "L'argent de l'acheteur est mis en garantie dès la commande et n'est libéré au producteur qu'une fois la livraison confirmée. Personne n'est lésé.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <path d="M6 15h4" />
      </svg>
    ),
  },
  {
    id: "suivi-livraison",
    title: "Suivi de livraison en temps réel",
    description:
      "Une carte interactive montre la position du transporteur, du départ jusqu'à l'arrivée.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    id: "verification-qr",
    title: "Vérification par QR code",
    description:
      "Chaque commande est validée à la remise grâce à un QR code unique, pour éviter les litiges et les erreurs de livraison.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <line x1="14" y1="14" x2="14" y2="21" />
        <line x1="21" y1="14" x2="21" y2="21" />
        <line x1="17.5" y1="14" x2="17.5" y2="17.5" />
      </svg>
    ),
  },
  {
    id: "notifications",
    title: "Notifications en temps réel",
    description:
      "Commande reçue, en préparation, en route, livrée — vous êtes informé à chaque étape.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    id: "profils-verifies",
    title: "Profils vérifiés et notés",
    description:
      "Chaque utilisateur (producteur, acheteur, transporteur) a un profil avec une note moyenne, basée sur les échanges précédents, pour construire la confiance.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
        <path d="M17 9l1.2 1.2L20.5 8" />
      </svg>
    ),
  },
  {
    id: "suivi-trajets",
    title: "Suivi des trajets pour les transporteurs",
    description:
      "Possibilité d'indiquer un trajet à l'avance (ville de départ, ville d'arrivée, capacité disponible, date) pour optimiser chaque voyage plutôt que de rouler à vide.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="9" width="15" height="8" rx="1" />
        <path d="M16 12h3l3 3v2h-6" />
        <circle cx="5.5" cy="19" r="1.8" />
        <circle cx="17.5" cy="19" r="1.8" />
      </svg>
    ),
  },
];

export default function FeatureSection() {
  return (
    <section id="features" className="feature-section">
      <h2>Pensé pour rassurer, pas seulement pour vendre</h2>

      <div className="feature-grid">
        {features.map((feature) => (
          <div key={feature.id} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}