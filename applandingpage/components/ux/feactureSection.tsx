"use client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import {
  CreditCard,
  MapPin,
  QrCode,
  Bell,
  UserCheck,
  Truck,
} from "lucide-react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const features = [
  {
    id: "paiement-securise",
    title: "Paiement sécurisé par Mobile Money (MTN MoMo)",
    description:
      "L'argent de l'acheteur est mis en garantie dès la commande et n'est libéré au producteur qu'une fois la livraison confirmée. Personne n'est lésé.",
    icon: CreditCard,
    span: "md:col-span-2",
    accentColor: "from-amber-500/20 via-yellow-500/10 to-transparent",
    iconBg: "group-hover:bg-amber-500 group-hover:text-black",
  },
  {
    id: "suivi-livraison",
    title: "Suivi de livraison en temps réel",
    description:
      "Une carte interactive montre la position du transporteur, du départ jusqu'à l'arrivée.",
    icon: MapPin,
    span: "md:col-span-1",
    accentColor: "from-emerald-500/20 via-teal-500/10 to-transparent",
    iconBg: "group-hover:bg-emerald-500 group-hover:text-black",
  },
  {
    id: "verification-qr",
    title: "Vérification par QR code",
    description:
      "Chaque commande est validée à la remise grâce à un QR code unique, pour éviter les litiges et les erreurs de livraison.",
    icon: QrCode,
    span: "md:col-span-1",
    accentColor: "from-indigo-500/20 via-blue-500/10 to-transparent",
    iconBg: "group-hover:bg-indigo-500 group-hover:text-white",
  },
  {
    id: "notifications",
    title: "Notifications en temps réel",
    description:
      "Commande reçue, en préparation, en route, livrée — vous êtes informé à chaque étape.",
    icon: Bell,
    span: "md:col-span-1",
    accentColor: "from-purple-500/20 via-pink-500/10 to-transparent",
    iconBg: "group-hover:bg-purple-500 group-hover:text-white",
  },
  {
    id: "profils-verifies",
    title: "Profils vérifiés et notés",
    description:
      "Chaque utilisateur a un profil avec une note moyenne, basée sur les échanges précédents, pour construire la confiance.",
    icon: UserCheck,
    span: "md:col-span-1",
    accentColor: "from-cyan-500/20 via-blue-500/10 to-transparent",
    iconBg: "group-hover:bg-cyan-500 group-hover:text-black",
  },
  {
    id: "suivi-trajets",
    title: "Suivi des trajets pour les transporteurs",
    description:
      "Possibilité d'indiquer un trajet à l'avance (ville de départ, ville d'arrivée, capacité disponible, date) pour optimiser chaque voyage plutôt que de rouler à vide.",
    icon: Truck,
    span: "md:col-span-2",
    accentColor: "from-emerald-600/20 via-green-500/10 to-transparent",
    iconBg: "group-hover:bg-emerald-600 group-hover:text-white",
  },
];

export default function FeatureSection() {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop Animations
      mm.add("(min-width: 768px)", () => {
        // 1. Titre Reveal avec effet split/blur
        gsap.fromTo(
          ".features-title",
          { y: 30, opacity: 0, filter: "blur(10px)" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: container.current,
              start: "top 80%",
              toggleActions: "play reverse play reverse",
            },
          }
        );

        // 2. Bento Asymmetric Reveal (Chaque carte rentre avec sa propre trajectoire)
        const cards = container.current?.querySelectorAll(".feature-card");
        if (cards) {
          const entryDirections = [
            { x: -60, y: -30, rotate: -3 }, // Card 1
            { x: 60, y: -40, rotate: 2 },   // Card 2
            { x: -40, y: 40, rotate: 2 },   // Card 3
            { x: 0, y: 50, rotate: -2 },    // Card 4
            { x: 40, y: 40, rotate: 3 },    // Card 5
            { x: -30, y: 60, rotate: -2 },  // Card 6
          ];

          cards.forEach((card, index) => {
            const dir = entryDirections[index] || { x: 0, y: 50, rotate: 0 };

            gsap.fromTo(
              card,
              {
                x: dir.x,
                y: dir.y,
                rotateZ: dir.rotate,
                opacity: 0,
                scale: 0.9,
                filter: "blur(8px)",
              },
              {
                x: 0,
                y: 0,
                rotateZ: 0,
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
                duration: 0.9,
                delay: index * 0.08,
                ease: "power4.out",
                scrollTrigger: {
                  trigger: ".features-grid",
                  start: "top 78%",
                  toggleActions: "play reverse play reverse",
                },
              }
            );
          });
        }

        // 3. Micro-interactions : Mouse Spotlight & Layer Parallax
        cards?.forEach((card) => {
          const glow = card.querySelector(".card-glow") as HTMLElement;
          const icon = card.querySelector(".feature-icon");
          const title = card.querySelector(".feature-h3");
          const desc = card.querySelector(".feature-p");

          const handleMouseMove = (e: Event) => {
            const mouseEvent = e as MouseEvent;
            const rect = card.getBoundingClientRect();
            const x = mouseEvent.clientX - rect.left;
            const y = mouseEvent.clientY - rect.top;

            // Halo lumineux
            if (glow) {
              gsap.to(glow, {
                opacity: 1,
                x: x - glow.offsetWidth / 2,
                y: y - glow.offsetHeight / 2,
                duration: 0.25,
                ease: "power1.out",
              });
            }

            // Depth Parallax
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const moveX = (x - centerX) / centerX;
            const moveY = (y - centerY) / centerY;

            gsap.to(card, {
              rotateX: -moveY * 5,
              rotateY: moveX * 5,
              duration: 0.3,
              ease: "power2.out",
              transformPerspective: 1000,
            });

            gsap.to(icon, { x: moveX * 6, y: moveY * 6, duration: 0.3 });
            gsap.to(title, { x: moveX * 3, y: moveY * 3, duration: 0.3 });
            gsap.to(desc, { x: moveX * 1.5, y: moveY * 1.5, duration: 0.3 });
          };

          const handleMouseLeave = () => {
            if (glow) gsap.to(glow, { opacity: 0, duration: 0.4 });

            gsap.to([card, icon, title, desc], {
              x: 0,
              y: 0,
              rotateX: 0,
              rotateY: 0,
              duration: 0.5,
              ease: "power2.out",
            });
          };

          card.addEventListener("mousemove", handleMouseMove);
          card.addEventListener("mouseleave", handleMouseLeave);
        });
      });

      // Mobile Fallback (Simple Stagger Smooth)
      mm.add("(max-width: 767px)", () => {
        gsap.fromTo(
          ".feature-card",
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".features-grid",
              start: "top 85%",
            },
          }
        );
      });
    },
    { scope: container }
  );

  return (
    <section ref={container} id="features" className="py-16">
      <div>
        <h2 className="features-title use-tanker-font text-4xl font-medium text-gray-900 dark:text-white mb-8">
          Pensé pour rassurer, pas seulement pour vendre
        </h2>

        <div className="features-grid grid grid-cols-1 md:grid-cols-4 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className={`${feature.span} feature-card group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col gap-3 transition-colors hover:border-gray-400 dark:hover:border-gray-700`}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Spotlight interactif coloré propre à chaque carte */}
                <div
                  className={`card-glow pointer-events-none absolute w-72 h-72 rounded-full bg-gradient-to-br ${feature.accentColor} blur-2xl opacity-0 -top-1/2 -left-1/2`}
                />

                {/* Icône animée */}
                <div
                  className={`feature-icon relative z-10 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-900 dark:text-white transition-all duration-300 ${feature.iconBg}`}
                >
                  <Icon size={20} strokeWidth={1.8} />
                </div>

                {/* Contenu */}
                <h3 className="feature-h3  relative z-10 text-xl font-bold text-gray-900 dark:text-white leading-snug">
                  {feature.title}
                </h3>
                <p className="feature-p relative z-10 text-md leading-relaxed text-gray-500 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}