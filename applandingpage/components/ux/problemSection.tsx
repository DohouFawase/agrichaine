"use client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function ProblemSection() {
  const t = useTranslations("problem");
  const container = useRef<HTMLElement>(null);

  const problems = t.raw("cards") as Array<{ title: string; desc: string }>;

  useGSAP(
    () => {
      // 1. Animation de la colonne gauche (Texte Sticky)
      gsap.fromTo(
        ".sticky-content > *",
        { y: 40, opacity: 0, filter: "blur(8px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".sticky-content",
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play reverse play reverse",
          },
        }
      );

      // 2. Animation d'entrée des cartes (3D + Blur)
      gsap.fromTo(
        ".problem-card",
        { y: 50, opacity: 0, filter: "blur(10px)", rotateX: -15 },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          rotateX: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".cards-container",
            start: "top 75%",
            end: "bottom 20%",
            toggleActions: "play reverse play reverse",
          },
        }
      );

      // 3. Animation du compteur des numéros (ex: 00 -> 01, 00 -> 02...)
      const numberElements = container.current?.querySelectorAll(".card-number");
      numberElements?.forEach((el) => {
        const targetValue = parseInt(el.getAttribute("data-value") || "0", 10);
        const obj = { val: 0 };

        gsap.fromTo(
          obj,
          { val: 0 },
          {
            val: targetValue,
            duration: 1.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play reverse play reverse",
            },
            onUpdate: () => {
              const formatted = Math.floor(obj.val).toString().padStart(2, "0");
              el.textContent = formatted;
            },
          }
        );
      });

      // 4. Animation d'apparition subtile des titres et desc de chaque carte
      gsap.fromTo(
        ".card-text-content > *",
        { y: 20, opacity: 0, filter: "blur(5px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".cards-container",
            start: "top 70%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    },
    { scope: container }
  );

  return (
    <section id="problem" ref={container} className=" py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Colonne gauche — texte sticky */}
        <div className="sticky-content md:sticky md:top-8 space-y-4">
          <h2 className="text-[28px] use-tanker-font font-medium text-gray-900 dark:text-white leading-tight">{t("title")}</h2>
          <p className="text-lg leading-relaxed text-gray-500 dark:text-gray-400">
            {t("description")}
          </p>
          <span className="inline-block text-sm font-medium text-gray-900 dark:text-white pl-4 pr-4 py-2.5 border-l-[3px] border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-800 rounded-r-lg">
            {t("result")}
          </span>
        </div>

        {/* Colonne droite — cartes numérotées */}
        <div className="cards-container flex flex-col gap-4">
          {problems.map((p, index) => (
            <div
              key={index}
              className="problem-card relative border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-white dark:bg-gray-900 overflow-hidden"
            >
              {/* Numéro avec compteur dynamique */}
              <div
                data-value={index + 1}
                className="card-number use-dancing-font  text-[32px] font-medium text-[#3C9F53] dark:text-gray-700 leading-none mb-2 tabular-nums"
              >
                00
              </div>

              {/* Conteneur de texte animé */}
              <div className="card-text-content space-y-1.5">
                <h4 className="text-xl font-black text-[#F49437] dark:text-white">
                  {p.title}
                </h4>
                <p className="text-lg leading-relaxed text-gray-500 dark:text-gray-400">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}