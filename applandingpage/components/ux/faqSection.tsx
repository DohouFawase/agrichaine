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
    <section id="faq" className="py-20 ">
      <div className="">
        <h2 className="text-[26px] font-medium text-gray-900 dark:text-white text-center mb-8">
          Questions fréquentes
        </h2>

        <div className="flex flex-col">
          {faqs.map((faq, i) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="border-b border-gray-200 dark:border-gray-800 first:border-t"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggle(faq.id)}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left bg-transparent border-none cursor-pointer"
                >
                  <div className="flex items-center flex-1">
                    <span className="text-[13px] font-medium text-gray-300 dark:text-gray-600 tabular-nums min-w-[28px] flex-shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[15px] font-medium text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                  </div>
                  <span className="w-7 h-7 rounded-full border-[1.5px] border-gray-900 dark:border-white flex items-center justify-center flex-shrink-0 text-gray-900 dark:text-white text-lg font-light leading-none">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <p className="text-[14px] leading-relaxed text-gray-500 dark:text-gray-400 pb-5 pl-[28px] max-w-[90%]">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}