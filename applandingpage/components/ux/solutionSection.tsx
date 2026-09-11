"use client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const stepIds = [
  "producteur",
  "transporteur",
  "acheteur",
];

const stepIcons = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5.5 h-5.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5.5 h-5.5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5.5 h-5.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function SolutionSection() {
  const t = useTranslations("solution");
  const steps = (t.raw("steps") as Array<{ title: string; desc: string }>).map((step, index) => ({ ...step, id: stepIds[index], icon: stepIcons[index].icon }));
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // 1. Animation du texte à gauche (Titre, Paragraphes, Encadré)
      gsap.fromTo(
        ".solution-text-content > *",
        { y: 35, opacity: 0, filter: "blur(8px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".solution-text-content",
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play reverse play reverse",
          },
        }
      );

      // 2. Traçage de la ligne verticale au scroll
      gsap.fromTo(
        ".flow-line",
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 1,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: ".flow-container",
            start: "top 75%",
            end: "bottom 30%",
            toggleActions: "play reverse play reverse",
          },
        }
      );

      // 3. Animation des icônes et des textes d'étapes en cascade
      const stepItems = container.current?.querySelectorAll(".step-item");
      stepItems?.forEach((item) => {
        const icon = item.querySelector(".step-icon");
        const text = item.querySelector(".step-text");

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: item,
            start: "top 80%",
            toggleActions: "play reverse play reverse",
          },
        });

        tl.fromTo(
          icon,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
        ).fromTo(
          text,
          { x: 30, opacity: 0, filter: "blur(6px)" },
          { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "power2.out" },
          "-=0.3"
        );
      });

      // 4. Animation des flèches d'orientation
      gsap.fromTo(
        ".flow-arrow",
        { opacity: 0, y: -8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".flow-container",
            start: "top 70%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    },
    { scope: container }
  );

  return (
    <section id="solutions" ref={container} className="py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Colonne gauche — texte */}
        <div className="solution-text-content">
          <h2 className="text-4xl use-tanker-font  font-medium text-gray-900 dark:text-white leading-tight mb-5">
            {t("title")}
          </h2>
          <p className="text-lg leading-relaxed text-gray-500 dark:text-gray-400 mb-4">
            {t("intro")}
          </p>
          <p className="text-lg   leading-relaxed text-gray-900 dark:text-white p-5 border-[1.5px] border-gray-900 dark:border-white rounded-[14px] bg-white dark:bg-gray-900">
            {t("description")}
          </p>
        </div>

        {/* Colonne droite — circuit vertical */}
        <div className="flow-container relative flex flex-col">
          {/* Ligne verticale animée */}
          <div className="flow-line absolute left-[27px] top-10 bottom-10 w-[1.5px] bg-gray-900 dark:bg-white origin-top" />

          {/* Flèches entre les étapes */}
          <div className="flow-arrow absolute left-[22px] top-[88px] w-3 h-3 z-10">
            <svg viewBox="0 0 12 12" className="w-full h-full fill-gray-900 dark:fill-white">
              <polygon points="6,12 0,0 12,0" />
            </svg>
          </div>
          <div className="flow-arrow absolute left-[22px] top-[180px] w-3 h-3 z-10">
            <svg viewBox="0 0 12 12" className="w-full h-full fill-gray-900 dark:fill-white">
              <polygon points="6,12 0,0 12,0" />
            </svg>
          </div>

          {steps.map((step) => (
            <div key={step.id} className="step-item relative z-[1] flex items-start gap-4 py-[18px]">
              <div className="step-icon w-14 h-14 rounded-full border-[1.5px] border-gray-900 dark:border-white bg-white dark:bg-gray-900 flex items-center justify-center flex-shrink-0 text-gray-900 dark:text-white shadow-sm">
                {step.icon}
              </div>
              <div className="step-text pt-1.5">
                <h4 className="text-lg font-medium use-tanker-font text-[#F49437] dark:text-white mb-1">
                  {step.title}
                </h4>
                <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
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