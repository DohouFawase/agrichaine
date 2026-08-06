/* eslint-disable @next/next/no-img-element */
const roleCards = [
  {
    id: "producteur",
    title: "Producteur",
    image: "https://placehold.co/400x300?text=Producteur",
    description:
      "Publiez vos produits en quelques photos, fixez votre prix, et recevez des commandes directement depuis votre téléphone. Vous êtes payé de manière sécurisée, sans passer par un revendeur qui rogne votre marge.",
  },
  {
    id: "acheteur",
    title: "Acheteur",
    image: "https://placehold.co/400x300?text=Acheteur",
    description:
      "Parcourez les produits disponibles près de chez vous, commandez en quelques clics, payez via Mobile Money (MTN MoMo), et suivez votre livraison en temps réel sur la carte — jusqu'à la remise en main propre.",
  },
  {
    id: "transporteur",
    title: "Transporteur",
    image: "https://placehold.co/400x300?text=Transporteur",
    description:
      "Consultez les trajets disponibles, proposez votre capacité de transport (poids, ville de départ, ville d'arrivée), acceptez les courses qui vous arrangent, et soyez payé pour chaque livraison effectuée.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="how-it-works-section">
      <h2>Une app, trois façons d&apos;en profiter</h2>

      <div className="how-it-works-cards">
        {roleCards.map((role) => (
          <div key={role.id} className="how-it-works-card">
            <img
              src={role.image}
              alt={role.title}
              className="how-it-works-image"
            />
            <h3>{role.title}</h3>
            <p>{role.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}