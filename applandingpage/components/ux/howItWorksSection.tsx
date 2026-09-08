/* eslint-disable @next/next/no-img-element */
"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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
  const t = useTranslations("how");
  const offsets = ["mt-0", "md:mt-12", "md:mt-24"];
  const container = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        // 1. Animation du chemin SVG (Fil conducteur de communication)
        if (pathRef.current) {
          const pathLength = pathRef.current.getTotalLength();
          
          gsap.set(pathRef.current, {
            strokeDasharray: pathLength,
            strokeDashoffset: pathLength,
          });

          // Dessin progressif de la ligne au scroll
          gsap.to(pathRef.current, {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: ".role-grid",
              start: "top 70%",
              end: "bottom 60%",
              scrub: 1.2,
            },
          });

          // Animation de la particule d'énergie qui circule sur le fil
          gsap.to(".flow-node", {
            motionPath: {
              path: pathRef.current,
              align: pathRef.current,
              alignOrigin: [0.5, 0.5],
            },
            duration: 4,
            repeat: -1,
            ease: "power1.inOut",
          });
        }

        // 2. Entrée fluide des cartes
        const cards = container.current?.querySelectorAll(".role-card");
        cards?.forEach((card, i) => {
          gsap.fromTo(
            card,
            {
              y: 60,
              opacity: 0,
              scale: 0.95,
              filter: "blur(6px)",
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
              duration: 0.9,
              delay: i * 0.18,
              ease: "power3.out",
              scrollTrigger: {
                trigger: ".role-grid",
                start: "top 75%",
                toggleActions: "play reverse play reverse",
              },
            }
          );

          // Parallaxe sur les numéros
          const num = card.querySelector(".bg-number");
          if (num) {
            gsap.to(num, {
              y: -30,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            });
          }

          // Micro-interactions au Survol
          const img = card.querySelector(".card-image");
          const tag = card.querySelector(".role-tag");

          const handleMouseMove = (e: Event) => {
            const mouseEvent = e as MouseEvent;
            const rect = card.getBoundingClientRect();
            const x = mouseEvent.clientX - rect.left;
            const y = mouseEvent.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -6;
            const rotateY = ((x - centerX) / centerX) * 6;

            gsap.to(card, {
              rotateX,
              rotateY,
              scale: 1.02,
              duration: 0.3,
              ease: "power2.out",
              transformPerspective: 1000,
            });
          };

          const handleMouseEnter = () => {
            gsap.to(img, { scale: 1.08, duration: 0.4, ease: "power2.out" });
            gsap.to(tag, { y: -2, duration: 0.2 });
            gsap.to(pathRef.current, { stroke: "#10b981", strokeWidth: 3, duration: 0.3 });
          };

          const handleMouseLeave = () => {
            gsap.to(card, {
              rotateX: 0,
              rotateY: 0,
              scale: 1,
              duration: 0.5,
              ease: "power2.out",
            });
            gsap.to(img, { scale: 1, duration: 0.4 });
            gsap.to(tag, { y: 0 });
            gsap.to(pathRef.current, { stroke: "currentColor", strokeWidth: 2, duration: 0.3 });
          };

          card.addEventListener("mousemove", handleMouseMove);
          card.addEventListener("mouseenter", handleMouseEnter);
          card.addEventListener("mouseleave", handleMouseLeave);
        });
      });

      // Mobile
      mm.add("(max-width: 767px)", () => {
        gsap.fromTo(
          ".role-card",
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.15,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".role-grid",
              start: "top 85%",
            },
          }
        );
      });
    },
    { scope: container }
  );

  return (
    <section id="working" ref={container} className="py-20 px-4 relative overflow-hidden">
      <div>
        <h2 className="how-title text-4xl use-tanker-font font-medium text-gray-900 dark:text-white text-center mb-16">
          {t("title")}
        </h2>

        <div className="role-grid relative grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Ligne fil de connexion SVG en arrière-plan */}
          <svg
            className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-0 text-emerald-500/30 dark:text-emerald-400/20"
            preserveAspectRatio="none"
            viewBox="0 0 900 400"
          >
            <path
              ref={pathRef}
              d="M 150,100 C 300,100 300,180 450,180 C 600,180 600,240 750,240"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="6 6"
              className="transition-colors duration-300"
            />
            {/* Pulsation lumineuse symbolisant le flux d'informations */}
            <circle
              className="flow-node fill-emerald-500 dark:fill-emerald-400"
              r="5"
            />
          </svg>

          {roleCards.map((role, i) => {
            const translated = (t.raw("cards") as Array<{ title: string; tag: string; description: string }>)[i];
            return (
            <div
              key={role.id}
              className={`role-card relative z-10 rounded-[20px] border dark:border-gray-800 overflow-hidden hover:shadow-xl bg-white dark:bg-gray-900 transition-shadow duration-300 ${offsets[i]}`}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Point focal d'attachement du fil */}
              <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500 animate-pulse z-20" />

              {/* Numéro filigrane géant */}
              <span className="bg-number absolute -top-3 left-4 text-[80px] font-medium leading-none text-gray-200 dark:text-gray-800 opacity-60 tabular-nums pointer-events-none z-0 select-none">
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Image + tag */}
              <div className="relative z-10 h-[180px] dark:border-gray-800 overflow-hidden">
                <img
                  src={role.image}
                  alt={translated.tag}
                  className="card-image w-full h-full object-cover transition-transform duration-500"
                />
                <span className="role-tag absolute top-3 right-3 text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md">
                  {translated.tag}
                </span>
              </div>

              {/* Contenu */}
              <div className="relative z-10 p-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2.5">
                  {translated.title}
                </h3>
                <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                  {translated.description}
                </p>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}