"use client";

import { useState } from "react";

const faqs = [
  {
    id: "pour-qui",
    question: "Onabaya, c'est pour qui ?",
    answer:
      "Pour toute personne qui produit, achète ou transporte des produits vivriers : agriculteurs, commerçants, particuliers, chauffeurs indépendants.",
  },
  {
    id: "payant",
    question: "Est-ce que je dois payer pour m'inscrire à la liste d'attente ?",
    answer: "Non, c'est gratuit et sans engagement.",
  },
  {
    id: "disponibilite",
    question: "Quand l'application sera-t-elle disponible ?",
    answer:
      "Dès que nous aurons réuni les 100 premiers testeurs, l'accès sera ouvert progressivement. Les inscrits seront prévenus en premier.",
  },
  {
    id: "paiement",
    question: "Comment se passe le paiement ?",
    answer:
      "Via Mobile Money (MTN MoMo). L'argent est bloqué en garantie jusqu'à la confirmation de la livraison, pour protéger acheteurs et producteurs.",
  },
  {
    id: "securite-donnees",
    question: "Mes données sont-elles en sécurité ?",
    answer:
      "Oui. Vos informations ne sont utilisées que pour vous contacter au sujet du lancement d'Onabaya.",
  },
];

export default function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <section id="faq" className="faq-section">
      <h2>Questions fréquentes</h2>

      <div className="faq-list">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className="faq-item">
              <button
                type="button"
                className="faq-question"
                aria-expanded={isOpen}
                onClick={() => toggle(faq.id)}
              >
                <span>{faq.question}</span>
                <span className="faq-icon">{isOpen ? "−" : "+"}</span>
              </button>

              {isOpen && <p className="faq-answer">{faq.answer}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}