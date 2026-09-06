"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const consent = localStorage.getItem("onabaya-cookie-consent");
    if (!consent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  useGSAP(
    () => {
      if (!visible || !bannerRef.current) return;

      // Animation d'apparition au montage
      gsap.fromTo(
        bannerRef.current,
        {
          y: 60,
          opacity: 0,
          scale: 0.95,
          filter: "blur(10px)",
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.7,
          ease: "back.out(1.4)",
          delay: 0.3,
        }
      );

      // Micro-interactions au survol des boutons
      const buttons = bannerRef.current.querySelectorAll(".cookie-btn");
      buttons.forEach((btn) => {
        const onMouseEnter = () =>
          gsap.to(btn, { y: -2, scale: 1.02, duration: 0.2, ease: "power2.out" });
        const onMouseLeave = () =>
          gsap.to(btn, { y: 0, scale: 1, duration: 0.2, ease: "power2.out" });

        btn.addEventListener("mouseenter", onMouseEnter);
        btn.addEventListener("mouseleave", onMouseLeave);
      });
    },
    { scope: bannerRef, dependencies: [visible] }
  );

  // Animation de sortie avant de démonter ou masquer
  const closeBanner = (consentValue: "accepted" | "refused") => {
    localStorage.setItem("onabaya-cookie-consent", consentValue);

    if (!bannerRef.current) {
      setVisible(false);
      return;
    }

    gsap.to(bannerRef.current, {
      y: 40,
      opacity: 0,
      scale: 0.95,
      filter: "blur(8px)",
      duration: 0.4,
      ease: "power3.in",
      onComplete: () => setVisible(false),
    });
  };

  if (!visible) return null;

  return (
    <div
      ref={bannerRef}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-180 z-9999 border-[1.5px] border-gray-900 dark:border-white rounded-2xl p-5 md:px-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-[0_10px_35px_-5px_rgba(0,0,0,0.12)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <p className="text-[13px] leading-relaxed text-gray-600 dark:text-gray-300 flex-1">
        Onabaya utilise des cookies pour améliorer votre expérience. En
        continuant, vous acceptez leur utilisation.{" "}
        <a
          href="/cookies"
          className="text-gray-900 dark:text-white font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          En savoir plus
        </a>
      </p>

      <div className="flex gap-2 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => closeBanner("refused")}
          className="cookie-btn flex-1 sm:flex-none px-5 py-2.5 text-[13px] font-medium rounded-xl border-[1.5px] border-gray-900 dark:border-white bg-transparent text-gray-900 dark:text-white cursor-pointer transition-colors"
        >
          Refuser
        </button>
        <button
          type="button"
          onClick={() => closeBanner("accepted")}
          className="cookie-btn flex-1 sm:flex-none px-5 py-2.5 text-[13px] font-medium rounded-xl border-[1.5px] border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900 cursor-pointer transition-colors"
        >
          Accepter
        </button>
      </div>
    </div>
  );
}