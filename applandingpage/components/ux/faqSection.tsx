"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function FaqSection() {
  const t = useTranslations("faq");
  const [openId, setOpenId] = useState<string | null>(null);
  const faqs = t.raw("items") as Array<{ question: string; answer: string }>;
  const container = useRef<HTMLElement>(null);
  const answerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const iconRefs = useRef<{ [key: string]: HTMLSpanElement | null }>({});

  useGSAP(
    () => {
      if (!container.current) return;

      // 1. Apparition du Titre avec défloutage
      gsap.fromTo(
        ".faq-title",
        { y: 30, opacity: 0, filter: "blur(10px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: container.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // 2. Cascade des questions avec défloutage au scroll
      gsap.fromTo(
        ".faq-item",
        { y: 30, opacity: 0, filter: "blur(8px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".faq-list",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // 3. Interactions magnétiques au survol (micro-déplacement du texte)
      const items = container.current.querySelectorAll(".faq-item");
      items.forEach((item) => {
        const text = item.querySelector(".faq-text");
        const num = item.querySelector(".faq-num");

        const onEnter = () => {
          gsap.to(text, { x: 8, duration: 0.3, ease: "power2.out" });
          gsap.to(num, { opacity: 1, duration: 0.3 });
        };

        const onLeave = () => {
          gsap.to(text, { x: 0, duration: 0.3, ease: "power2.out" });
          gsap.to(num, { opacity: 0.5, duration: 0.3 });
        };

        item.addEventListener("mouseenter", onEnter);
        item.addEventListener("mouseleave", onLeave);
      });

      // Recalcul critique des positions ScrollTrigger
      ScrollTrigger.refresh();
    },
    { scope: container }
  );

  // 4. Gestion fluide de l'accordéon
  function toggle(id: string) {
    const isOpening = openId !== id;
    const previousId = openId;

    setOpenId(isOpening ? id : null);

    // Fermeture de l'élément actif
    if (previousId && answerRefs.current[previousId]) {
      const prevAnswer = answerRefs.current[previousId];
      const prevIcon = iconRefs.current[previousId];

      gsap.to(prevAnswer, {
        height: 0,
        opacity: 0,
        filter: "blur(6px)",
        y: -6,
        duration: 0.35,
        ease: "power3.inOut",
      });

      if (prevIcon) {
        gsap.to(prevIcon, { rotate: 0, scale: 1, duration: 0.3, ease: "power2.inOut" });
      }
    }

    // Ouverture du nouvel élément
    if (isOpening && answerRefs.current[id]) {
      const targetAnswer = answerRefs.current[id];
      const targetIcon = iconRefs.current[id];

      gsap.fromTo(
        targetAnswer,
        { height: 0, opacity: 0, filter: "blur(6px)", y: -6 },
        {
          height: "auto",
          opacity: 1,
          filter: "blur(0px)",
          y: 0,
          duration: 0.45,
          ease: "power4.out",
        }
      );

      if (targetIcon) {
        gsap.to(targetIcon, {
          rotate: 135,
          scale: 1.1,
          duration: 0.4,
          ease: "back.out(1.7)",
        });
      }
    }
  }

  return (
    <section ref={container} id="faq" className="py-20">
      <div>
        <h2 className="faq-title use-tanker-font text-4xl font-bold text-gray-900 dark:text-white text-center mb-12">
          {t("title")}
        </h2>

        <div className="faq-list flex flex-col">
          {faqs.map((faq, i) => {
            const faqId = `faq-${i}`;
            const isOpen = openId === faqId;
            return (
              <div
                  key={faqId}
                className="faq-item relative border-b border-gray-200 dark:border-gray-800 first:border-t transition-colors duration-300 hover:bg-gray-50/50 dark:hover:bg-gray-900/30"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggle(faqId)}
                  className="w-full flex items-center justify-between gap-4 py-6 text-left bg-transparent border-none cursor-pointer px-2"
                >
                  <div className="flex items-center flex-1">
                    <span className="faq-num text-base use-dancing-font font-medium text-gray-400 dark:text-gray-500 tabular-nums min-w-[32px] flex-shrink-0 opacity-50 transition-opacity">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="faq-text text-xl font-medium text-gray-900 dark:text-white inline-block">
                      {faq.question}
                    </span>
                  </div>

                  <span
                    ref={(el) => {
                      iconRefs.current[faqId] = el;
                    }}
                    className="w-8 h-8 rounded-full border border-gray-900 dark:border-white flex items-center justify-center flex-shrink-0 text-gray-900 dark:text-white text-lg font-light leading-none select-none"
                  >
                    +
                  </span>
                </button>

                <div
                  ref={(el) => {
                    answerRefs.current[faqId] = el;
                  }}
                  className="overflow-hidden h-0 opacity-0"
                >
                  <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400 pb-6 pl-[34px] max-w-[85%]">
                    {faq.answer}
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