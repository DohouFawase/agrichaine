"use client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Play } from "lucide-react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function HeroSection() {
  const t = useTranslations("hero");
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // 1. Timeline principale déclenchée au scroll avec effet de flou (blur)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play reverse play reverse",
        },
      });

      // Animation des mots du titre : Apparition + Flou progressif + Rotation 3D
      tl.fromTo(
        ".word",
        { y: 60, opacity: 0, filter: "blur(12px)", rotateX: -45 },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          rotateX: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
        }
      )
        // Animation du paragraphe et des boutons : Flou progressif
        .fromTo(
          ".box-sub",
          { y: 40, opacity: 0, filter: "blur(10px)", rotateX: -20 },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            rotateX: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power2.out",
          },
          "-=0.5"
        );

      // 2. Parallaxe au scroll : la section s'enfonce doucement au défilement
      gsap.to(".hero-wrapper", {
        y: 80,
        opacity: 0.3,
        scale: 0.96,
        ease: "none",
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // 3. Micro-interaction Magnétique sur les boutons
      const buttons = container.current?.querySelectorAll(".magnetic-btn");
      buttons?.forEach((btn) => {
        btn.addEventListener("mousemove", (e: Event) => {
          const mouseEvent = e as MouseEvent;
          const rect = btn.getBoundingClientRect();
          const x = mouseEvent.clientX - rect.left - rect.width / 2;
          const y = mouseEvent.clientY - rect.top - rect.height / 2;

          gsap.to(btn, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.3,
            ease: "power2.out",
          });
        });

        btn.addEventListener("mouseleave", () => {
          gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.4)",
          });
        });
      });
    },
    { scope: container }
  );

  const titleText = t("title");

  return (
    <section ref={container} className="hero h-screen py-28">
      <div className="hero-wrapper space-y-6 flex flex-col items-center text-center">
        {/* Titre découpé mot par mot */}
        <h1 className="text-8xl use-tanker-font font-medium max-w-3xl flex flex-wrap justify-center gap-x-3 gap-y-1">
          {titleText.split(" ").map((word, index) => (
            <span key={index} className="word inline-block">
              {word}
            </span>
          ))}
        </h1>

        {/* Paragraphe */}
        <p className="text-lg max-w-2xl text-muted-foreground box-sub">
          {t("description")}
        </p>

        {/* Boutons */}
        <div className="box-sub">
          <div className="flex items-center gap-4">
            <button className="magnetic-btn flex items-center gap-2.5">
              <Play />
              <div className="">
                <span className="">{t("downloadOn")}</span>
                <p>Play Store</p>
              </div>
            </button>

            <button className="magnetic-btn flex items-center gap-2.5">
              <svg
                fill="#000000"
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                data-name="Layer 1"
              >
                <path d="M14.94,5.19A4.38,4.38,0,0,0,16,2,4.44,4.44,0,0,0,13,3.52,4.17,4.17,0,0,0,12,6.61,3.69,3.69,0,0,0,14.94,5.19Zm2.52,7.44a4.51,4.51,0,0,1,2.16-3.81,4.66,4.66,0,0,0-3.66-2c-1.56-.16-3,.91-3.83.91s-2-.89-3.3-.87A4.92,4.92,0,0,0,4.69,9.39C2.93,12.45,4.24,17,6,19.47,6.8,20.68,7.8,22.05,9.12,22s1.75-.82,3.28-.82,2,.82,3.3.79,2.22-1.24,3.06-2.45a11,11,0,0,0,1.38-2.85A4.41,4.41,0,0,1,17.46,12.63Z" />
              </svg>
              <div className="">
                <span className="">{t("downloadOn")}</span>
                <p>App Store</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}