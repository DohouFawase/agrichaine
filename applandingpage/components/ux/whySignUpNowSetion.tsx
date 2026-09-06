"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!container.current) return;

      // 1. Apparition du Titre avec effet Blur de mise au point
      gsap.fromTo(
        ".section-title",
        { y: 30, opacity: 0, filter: "blur(12px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: container.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // 2. Cascade des cartes avec défloutage et élévation
      gsap.fromTo(
        ".adv-card",
        { y: 50, opacity: 0, filter: "blur(10px)", scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          scale: 1,
          stagger: 0.14,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".adv-grid",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // 3. Animation dédiée pour les numéros en filigrane lors du scroll
      gsap.fromTo(
        ".bg-num",
        { y: -20, opacity: 0, scale: 1.3 },
        {
          y: 0,
          opacity: 0.5,
          scale: 1,
          stagger: 0.14,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".adv-grid",
            start: "top 85%",
          },
        }
      );

      // 4. Bannière CTA
      gsap.fromTo(
        ".cta-banner",
        { y: 40, opacity: 0, filter: "blur(12px)", scale: 0.97 },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".cta-banner",
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // 5. Interactions au survol (micro-déplacements fluides)
      const cards = container.current.querySelectorAll(".adv-card");
      cards.forEach((card) => {
        const num = card.querySelector(".bg-num");

        const onEnter = () => {
          gsap.to(card, { y: -6, scale: 1.01, duration: 0.35, ease: "power2.out" });
          gsap.to(num, { y: -8, opacity: 0.8, scale: 1.05, duration: 0.35, ease: "power2.out" });
        };

        const onLeave = () => {
          gsap.to(card, { y: 0, scale: 1, duration: 0.35, ease: "power2.out" });
          gsap.to(num, { y: 0, opacity: 0.5, scale: 1, duration: 0.35, ease: "power2.out" });
        };

        card.addEventListener("mouseenter", onEnter);
        card.addEventListener("mouseleave", onLeave);
      });

      // 6. Interaction du bouton CTA
      const btn = container.current.querySelector(".cta-button");
      if (btn) {
        const onBtnEnter = () => gsap.to(btn, { scale: 1.05, duration: 0.25, ease: "back.out(2)" });
        const onBtnLeave = () => gsap.to(btn, { scale: 1, duration: 0.25, ease: "power2.out" });

        btn.addEventListener("mouseenter", onBtnEnter);
        btn.addEventListener("mouseleave", onBtnLeave);
      }

      // Re-calcul immédiat pour garantir l'activation du scroll
      ScrollTrigger.refresh();
    },
    { scope: container }
  );

  return (
    <section ref={container} id="waiting-list" className="py-20">
      <div>
        <h2 className="section-title text-4xl  font-bold use-tanker-font text-gray-900 dark:text-white text-center mb-10">
          Pourquoi rejoindre la liste d&apos;attente aujourd&apos;hui
        </h2>

        {/* Grid 2x2 des avantages */}
        <div className="adv-grid grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {advantages.map((adv) => (
            <div
              key={adv.number}
              className="adv-card relative border-[1.5px] border-gray-900 dark:border-white rounded-2xl p-7 bg-white dark:bg-gray-900 overflow-hidden cursor-default transition-colors"
            >
              {/* Numéro filigrane */}
              <span className="bg-num use-dancing-font absolute top-2 right-4 text-[64px] font-medium leading-none text-gray-200 dark:text-gray-800 opacity-50 tabular-nums pointer-events-none select-none">
                {adv.number}
              </span>

              <h3 className="relative z-10 text-xl font-bold text-gray-900 dark:text-white mb-2">
                {adv.title}
              </h3>
              <p className="relative z-10 text-base leading-relaxed text-gray-500 dark:text-gray-400">
                {adv.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bannière CTA */}
        <div className="cta-banner border-[1.5px] border-gray-900 dark:border-white rounded-2xl p-10 text-center bg-gray-900 dark:bg-white text-white dark:text-gray-900">
          <h3 className="text-2xl font-bold mb-2">
            Rejoignez la liste d&apos;attente
          </h3>
          <p className="text-base leading-relaxed opacity-70 mb-6 max-w-md mx-auto">
            100 places seulement. Gratuit, sans engagement, et vous serez les
            premiers à tester Onabaya.
          </p>
          <button
            type="button"
            className="cta-button inline-block px-8 py-3 text-base font-medium rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white cursor-pointer transition-colors"
          >
            Je m&apos;inscris
          </button>
        </div>
      </div>
    </section>
  );
}