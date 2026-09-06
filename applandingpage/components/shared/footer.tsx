/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const navLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Pourquoi s'inscrire", href: "#pourquoi-sinscrire" },
  { label: "Liste d'attente", href: "#inscription" },
  { label: "FAQ", href: "#faq" },
];

const legalLinks = [
  { label: "Conditions d'utilisation", href: "/cgu" },
  { label: "Politique de confidentialité", href: "/politique-confidentialite" },
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Cookies", href: "/cookies" },
];

const contactLinks = [
  { label: "contact@onabaya.ci", href: "mailto:contact@onabaya.bj" },
  { label: "+229 01 97 39 57 56", href: "tel:+2290197395756" },
];

const bottomLinks = [
  { label: "CGU", href: "/cgu" },
  { label: "Confidentialité", href: "/politique-confidentialite" },
  { label: "Cookies", href: "/cookies" },
];

export default function FooterSection() {
  const footerRef = useRef<HTMLElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentYear, setCurrentYear] = useState<number>(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useGSAP(
    () => {
      if (!footerRef.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });

      tl.fromTo(
        ".footer-col",
        { y: 40, opacity: 0, filter: "blur(12px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
        }
      )
        .fromTo(
          ".footer-link-item",
          { y: 12, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.03,
            duration: 0.5,
            ease: "power2.out",
          },
          "-=0.5"
        )
        .fromTo(
          ".footer-bottom",
          { opacity: 0, filter: "blur(6px)", y: 15 },
          { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.6, ease: "power2.out" },
          "-=0.4"
        );

      const allLinks = footerRef.current.querySelectorAll(".creative-link");
      allLinks.forEach((link) => {
        const line = link.querySelector(".link-line");

        const onEnter = () => {
          gsap.to(link, { y: -2.5, x: 3, duration: 0.25, ease: "power2.out" });
          if (line) {
            gsap.to(line, { scaleX: 1, transformOrigin: "left bottom", duration: 0.3, ease: "power3.out" });
          }
        };

        const onLeave = () => {
          gsap.to(link, { y: 0, x: 0, duration: 0.25, ease: "power2.out" });
          if (line) {
            gsap.to(line, { scaleX: 0, transformOrigin: "right bottom", duration: 0.25, ease: "power3.in" });
          }
        };

        link.addEventListener("mouseenter", onEnter);
        link.addEventListener("mouseleave", onLeave);
      });

      const socialIcons = footerRef.current.querySelectorAll(".social-btn");
      socialIcons.forEach((btn) => {
        const onEnter = () =>
          gsap.to(btn, { y: -5, scale: 1.15, rotate: 12, duration: 0.4, ease: "back.out(2)" });

        const onLeave = () =>
          gsap.to(btn, { y: 0, scale: 1, rotate: 0, duration: 0.3, ease: "power2.out" });

        btn.addEventListener("mouseenter", onEnter);
        btn.addEventListener("mouseleave", onLeave);
      });

      ScrollTrigger.refresh();
    },
    { scope: footerRef }
  );

  const animateSuccess = () => {
    const btn = footerRef.current?.querySelector(".newsletter-btn");
    const checkIcon = footerRef.current?.querySelector(".check-icon");
    const particles = particlesRef.current?.querySelectorAll(".particle");

    if (!btn) return;

    const tl = gsap.timeline();

    tl.to(btn, {
      width: "42px",
      paddingLeft: "0px",
      paddingRight: "0px",
      borderRadius: "9999px",
      backgroundColor: "#10b981",
      duration: 0.4,
      ease: "back.inOut(1.7)",
    })
    .to(checkIcon, {
      scale: 1,
      opacity: 1,
      rotate: 0,
      duration: 0.3,
      ease: "back.out(2)",
    }, "-=0.1");

    if (particles && particles.length > 0) {
      particles.forEach((p, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const radius = 24 + Math.random() * 16;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        gsap.fromTo(
          p,
          { x: 0, y: 0, opacity: 1, scale: 1 },
          {
            x,
            y,
            opacity: 0,
            scale: 0.2,
            duration: 0.6 + Math.random() * 0.2,
            ease: "power3.out",
            delay: 0.3,
          }
        );
      });
    }

    gsap.to(".newsletter-input-group", {
      opacity: 0.4,
      filter: "blur(2px)",
      duration: 0.4,
    });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setStatus("error");
      setErrorMessage("Email invalide");

      gsap.fromTo(
        ".newsletter-input-group",
        { x: -6 },
        { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" }
      );
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      setStatus("success");
      setEmail("");
      animateSuccess();
    } catch {
      setStatus("error");
      setErrorMessage("Une erreur est survenue.");
    }
  };

  function handleNewsletterFocus(e: React.FocusEvent<HTMLInputElement>) {
    const wrapper = e.target.closest(".newsletter-input-group");
    if (!wrapper) return;

    const indicator = wrapper.querySelector(".active-indicator");

    gsap.to(e.target, {
      y: -2,
      scale: 1.01,
      boxShadow: "0px 10px 20px -5px rgba(0, 0, 0, 0.1)",
      duration: 0.25,
      ease: "power2.out",
    });

    if (indicator) {
      gsap.to(indicator, { height: "70%", opacity: 1, duration: 0.25, ease: "power3.out" });
    }
  }

  function handleNewsletterBlur(e: React.FocusEvent<HTMLInputElement>) {
    const wrapper = e.target.closest(".newsletter-input-group");
    if (!wrapper) return;

    const indicator = wrapper.querySelector(".active-indicator");

    gsap.to(e.target, {
      y: 0,
      scale: 1,
      boxShadow: "0px 0px 0px 0px rgba(0, 0, 0, 0)",
      duration: 0.25,
      ease: "power2.out",
    });

    if (indicator) {
      gsap.to(indicator, { height: "0%", opacity: 0, duration: 0.2, ease: "power3.in" });
    }
  }

  return (
    <footer
      ref={footerRef}
      className="py-16 px-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden"
    >
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 pb-10 border-b border-gray-200 dark:border-gray-800">
          
          {/* Colonne 1 — Brand */}
          <div className="footer-col lg:col-span-1">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white tracking-tight mb-2.5">
              Onabaya
            </h3>
            <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400 mb-5 max-w-70">
              La plateforme qui connecte directement producteurs, acheteurs et
              transporteurs de produits vivriers en Bénin.
            </p>
            <div className="flex gap-2.5">
              {[
                {
                  key: "fb",
                  icon: (
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  ),
                },
                {
                  key: "ig",
                  icon: (
                    <>
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </>
                  ),
                },
                {
                  key: "tw",
                  icon: (
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  ),
                },
                {
                  key: "li",
                  icon: (
                    <>
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </>
                  ),
                },
              ].map((item) => (
                <a
                  key={item.key}
                  href="#"
                  className="social-btn w-9 h-9 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white dark:text-gray-400 transition-colors"
                  aria-label="Réseau social"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    {item.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Colonne 2 — Navigation */}
          <div className="footer-col">
            <h4 className="text-base font-medium text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <ul className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <li key={link.href} className="footer-link-item">
                  <a
                    href={link.href}
                    className="creative-link relative inline-flex items-center text-base font-normal text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors py-0.5"
                  >
                    <span>{link.label}</span>
                    <span className="link-line absolute bottom-0 left-0 w-full h-[1.5px] bg-gray-900 dark:bg-white scale-x-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 3 — Légal */}
          <div className="footer-col">
            <h4 className="text-base font-medium text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Légal
            </h4>
            <ul className="flex flex-col gap-3">
              {legalLinks.map((link) => (
                <li key={link.label} className="footer-link-item">
                  <a
                    href={link.href}
                    className="creative-link relative inline-flex items-center text-base font-normal text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors py-0.5"
                  >
                    <span>{link.label}</span>
                    <span className="link-line absolute bottom-0 left-0 w-full h-[1.5px] bg-gray-900 dark:bg-white scale-x-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 4 — Contact + Newsletter */}
          <div className="footer-col">
            <h4 className="text-base font-medium text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Contact
            </h4>
            <ul className="flex flex-col gap-3 mb-6">
              {contactLinks.map((link) => (
                <li key={link.label} className="footer-link-item">
                  <a
                    href={link.href}
                    className="creative-link relative inline-flex items-center text-base font-normal text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors py-0.5"
                  >
                    <span>{link.label}</span>
                    <span className="link-line absolute bottom-0 left-0 w-full h-[1.5px] bg-gray-900 dark:bg-white scale-x-0" />
                  </a>
                </li>
              ))}
              <li className="footer-link-item">
                <span className="text-base text-gray-400 dark:text-gray-500">
                  Cotonou, Bénin
                </span>
              </li>
            </ul>

            {/* Newsletter Form */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5 leading-relaxed">
                Recevez les actualités du lancement
              </p>

              <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <div className="newsletter-input-group relative flex-1 pl-2 transition-all">
                    <span className="active-indicator absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-0 bg-gray-900 dark:bg-white rounded-full opacity-0 transition-all" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Votre email"
                      onFocus={handleNewsletterFocus}
                      onBlur={handleNewsletterBlur}
                      disabled={status === "loading" || status === "success"}
                      className="w-full px-3.5 py-2.5 text-base border-[1.5px] border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none focus:border-gray-900 dark:focus:border-white placeholder:text-gray-400 transition-colors disabled:opacity-50"
                    />
                  </div>

                  <div className="relative flex items-center justify-center">
                    <div
                      ref={particlesRef}
                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    >
                      {[...Array(10)].map((_, i) => (
                        <span
                          key={i}
                          className="particle absolute w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-0"
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={status === "loading" || status === "success"}
                      className="newsletter-btn h-10.5 px-4 py-2.5 text-base font-medium rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 cursor-pointer whitespace-nowrap transition-all flex items-center justify-center overflow-hidden relative"
                    >
                      {status === "loading" ? (
                        <span className="animate-spin w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full" />
                      ) : status === "success" ? (
                        <svg
                          className="check-icon w-5 h-5 text-white scale-0 opacity-0 -rotate-45"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span>S&apos;abonner</span>
                      )}
                    </button>
                  </div>
                </div>

                {status === "error" && (
                  <p className="text-[11px] text-red-500 mt-1 pl-1">{errorMessage}</p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            ©<span className="use-dancing-font"> {currentYear}</span> Onabaya. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            {bottomLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="creative-link relative inline-flex items-center text-xs text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors py-0.5"
              >
                <span>{link.label}</span>
                <span className="link-line absolute bottom-0 left-0 w-full h-px bg-gray-900 dark:bg-white scale-x-0" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}