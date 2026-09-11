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
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play reverse play reverse",
        },
      });

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
      ).fromTo(
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

      const isTouchDevice =
        typeof window !== "undefined" &&
        window.matchMedia("(pointer: coarse)").matches;

      if (!isTouchDevice) {
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
      }
    },
    { scope: container }
  );

  const titleText = t("title");

  return (
    <section
      ref={container}
      className="hero relative overflow-hidden min-h-[90vh] sm:h-screen bg-[#134D37] mt-8 sm:mt-12 rounded-2xl py-16 sm:py-28 px-4"
    >
      {/* Image de fond : toujours centrée, peu importe le ratio de l'écran */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <img
          src="/hero-app-mockup.jpg"
          alt=""
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto max-w-none object-cover"
        />
        <div className="absolute inset-0 bg-[#134D37]/50" />
      </div>

      <div className="hero-wrapper relative z-10 space-y-5 sm:space-y-6 flex flex-col items-center text-center">
        <h1 className="text-4xl sm:text-6xl lg:text-8xl text-[#F49437] use-tanker-font font-medium max-w-xs sm:max-w-xl lg:max-w-3xl flex flex-wrap justify-center gap-x-2 sm:gap-x-3 gap-y-1">
          {titleText.split(" ").map((word, index) => (
            <span key={index} className="word inline-block">
              {word}
            </span>
          ))}
        </h1>

        <p className="text-base sm:text-lg text-white max-w-xs sm:max-w-xl lg:max-w-2xl box-sub">
          {t("description")}
        </p>

        <div className="box-sub w-full">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none mx-auto">
            <button className="magnetic-btn w-full sm:w-auto bg-white p-2.5 px-4.5 rounded-3xl flex items-center justify-center gap-2.5">
              <Play className="shrink-0" />
              <div className="font-bold text-base sm:text-lg text-left">
                <span>{t("downloadOn")}</span>
                <p>Play Store</p>
              </div>
            </button>

            <button className="magnetic-btn w-full sm:w-auto border border-white p-2.5 px-4.5 rounded-3xl flex items-center justify-center gap-2.5">
              <svg
                fill="#fff"
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                data-name="Layer 1"
                className="shrink-0"
              >
                <path d="M14.94,5.19A4.38,4.38,0,0,0,16,2,4.44,4.44,0,0,0,13,3.52,4.17,4.17,0,0,0,12,6.61,3.69,3.69,0,0,0,14.94,5.19Zm2.52,7.44a4.51,4.51,0,0,1,2.16-3.81,4.66,4.66,0,0,0-3.66-2c-1.56-.16-3,.91-3.83.91s-2-.89-3.3-.87A4.92,4.92,0,0,0,4.69,9.39C2.93,12.45,4.24,17,6,19.47,6.8,20.68,7.8,22.05,9.12,22s1.75-.82,3.28-.82,2,.82,3.3.79,2.22-1.24,3.06-2.45a11,11,0,0,0,1.38-2.85A4.41,4.41,0,0,1,17.46,12.63Z" />
              </svg>
              <div className="text-white font-bold text-base sm:text-lg text-left">
                <span>{t("downloadOn")}</span>
                <p>App Store</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}