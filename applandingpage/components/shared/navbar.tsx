"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "Problemes", href: "#problem" },
  { label: "Solutions", href: "#solutions" },
  { label: "Comment ça marche", href: "#working" },
  { label: "Liste d\'attentes", href: "#waiting-list" },
  { label: "Faqs", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // 1. Animation GSAP : Effet 'Sticky Glass' au défilement & Entrée initiale
  useGSAP(
    () => {
      if (!headerRef.current) return;

      // Animation d'apparition des éléments à l'affichage de la page
      const entryTl = gsap.timeline();
      entryTl
        .fromTo(
          ".nav-logo",
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }
        )
        .fromTo(
          ".nav-item",
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" },
          "-=0.4"
        )
        .fromTo(
          ".nav-cta",
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
          "-=0.3"
        );

      // ScrollTrigger : Transformation de la barre de navigation lors du défilement
      ScrollTrigger.create({
        trigger: document.body,
        start: "top -50px",
        onEnter: () => {
          gsap.to(headerRef.current, {
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(12px)",
            borderColor: "rgba(229, 231, 235, 0.8)",
            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.08)",
            paddingTop: "10px",
            paddingBottom: "10px",
            duration: 0.4,
            ease: "power2.out",
          });
        },
        onLeaveBack: () => {
          gsap.to(headerRef.current, {
            backgroundColor: "transparent",
            backdropFilter: "blur(0px)",
            borderColor: "transparent",
            boxShadow: "none",
            paddingTop: "16px",
            paddingBottom: "16px",
            duration: 0.4,
            ease: "power2.out",
          });
        },
      });
    },
    { scope: headerRef }
  );

  // 2. Gestion de l'ouverture/fermeture du menu mobile
  const toggleMobileMenu = () => {
    setIsOpen((prev) => !prev);

    if (!isOpen) {
      gsap.to(mobileMenuRef.current, {
        height: "auto",
        opacity: 1,
        duration: 0.4,
        ease: "power3.out",
      });
      gsap.fromTo(
        ".mobile-nav-item",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.3, ease: "power2.out", delay: 0.1 }
      );
    } else {
      gsap.to(mobileMenuRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power3.in",
      });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all">
      <div
        ref={headerRef}
        className="mx-auto border border-transparent rounded-2xl transition-all duration-300 my-2 px-6 py-4 container"
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="nav-logo flex items-center">
            <Link href="/">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-12 w-auto object-contain transition-transform duration-300 hover:scale-105"
              />
            </Link>
          </div>

          {/* Navigation Bureau */}
          <nav className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-6">
              {navLinks.map((link) => (
                <li key={link.label} className="nav-item">
                  <Link
                    href={link.href}
                    className="relative text-base font-medium text-gray-700 hover:text-gray-900 transition-colors py-1 group"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* CTA Bureau */}
          <div className="hidden md:block nav-cta">
            <button className="relative px-5 py-2.5 text-base font-semibold text-white bg-gray-900 rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-95">
              Download App
            </button>
          </div>

          {/* Bouton Hamburger Mobile */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-700 focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menu Déroulant Mobile */}
        <div
          ref={mobileMenuRef}
          className="md:hidden h-0 opacity-0 overflow-hidden transition-all"
        >
          <div className="flex flex-col gap-4 pt-6 pb-4 border-t border-gray-100 mt-4">
            <ul className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <li key={link.label} className="mobile-nav-item">
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-base font-medium text-gray-700 hover:text-gray-900 block py-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mobile-nav-item pt-2">
              <button className="w-full py-3 text-base font-semibold text-white bg-gray-900 rounded-xl shadow-md">
                Download App
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;