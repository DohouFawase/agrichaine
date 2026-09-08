"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { useLocale } from "@/components/providers/locale-provider";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const roleOptions = [
  { value: "producteur", label: "Producteur" },
  { value: "acheteur", label: "Acheteur" },
  { value: "transporteur", label: "Transporteur" },
  { value: "indecis", label: "Je ne sais pas encore" },
];

export default function SignupFormSection() {
  const t = useTranslations("signup");
  const { locale } = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [waitlistResult, setWaitlistResult] = useState<{ position: number; referralCode: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    role: "",
    ville: "",
  });

  const container = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!container.current) return;

      // 1. Entrée globale de la section (Titre, desc, points de confiance)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });

      tl.fromTo(
        ".signup-title",
        { y: 35, opacity: 0, filter: "blur(12px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "power3.out" }
      )
        .fromTo(
          ".signup-desc",
          { y: 25, opacity: 0, filter: "blur(8px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power3.out" },
          "-=0.5"
        )
        .fromTo(
          ".trust-point",
          { x: -20, opacity: 0, filter: "blur(6px)" },
          {
            x: 0,
            opacity: 1,
            filter: "blur(0px)",
            stagger: 0.1,
            duration: 0.6,
            ease: "power2.out",
          },
          "-=0.4"
        );

      // 2. Entrée séquentielle de la carte et des inputs
      gsap.fromTo(
        cardRef.current,
        { y: 50, opacity: 0, filter: "blur(16px)", scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          scale: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Stagger sur les champs à l'apparition
      gsap.fromTo(
        ".field-group",
        { y: 20, opacity: 0, filter: "blur(6px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          stagger: 0.08,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 80%",
          },
        }
      );

      // 3. Interactions créatives au survol des boutons et des champs
      const btn = container.current.querySelector(".submit-btn");
      if (btn) {
        const onBtnEnter = () => gsap.to(btn, { scale: 1.02, duration: 0.25, ease: "power2.out" });
        const onBtnLeave = () => gsap.to(btn, { scale: 1, duration: 0.25, ease: "power2.out" });
        btn.addEventListener("mouseenter", onBtnEnter);
        btn.addEventListener("mouseleave", onBtnLeave);
      }

      ScrollTrigger.refresh();
    },
    { scope: container }
  );

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // Animation au FOCUS : Élévation, translation du label et étirement de la barre indicatrice
  function handleInputFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    const wrapper = e.target.closest(".field-group");
    if (!wrapper) return;

    const label = wrapper.querySelector("label");
    const indicator = wrapper.querySelector(".active-indicator");

    gsap.to(e.target, {
      y: -2,
      scale: 1.005,
      boxShadow: "0px 10px 20px -5px rgba(0, 0, 0, 0.08)",
      duration: 0.25,
      ease: "power2.out",
    });

    if (label) {
      gsap.to(label, { x: 4, opacity: 1, duration: 0.2, ease: "power2.out" });
    }

    if (indicator) {
      gsap.to(indicator, { height: "100%", opacity: 1, duration: 0.25, ease: "power3.out" });
    }
  }

  // Animation au BLUR : Retour à l'état initial
  function handleInputBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    const wrapper = e.target.closest(".field-group");
    if (!wrapper) return;

    const label = wrapper.querySelector("label");
    const indicator = wrapper.querySelector(".active-indicator");

    gsap.to(e.target, {
      y: 0,
      scale: 1,
      boxShadow: "0px 0px 0px 0px rgba(0, 0, 0, 0)",
      duration: 0.25,
      ease: "power2.out",
    });

    if (label) {
      gsap.to(label, { x: 0, opacity: 0.9, duration: 0.2, ease: "power2.out" });
    }

    if (indicator) {
      gsap.to(indicator, { height: "0%", opacity: 0, duration: 0.2, ease: "power3.in" });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.nom,
          email: formData.email,
          role: formData.role,
          city: formData.ville,
          locale,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        position?: number;
        referralCode?: string;
      };

      if (!response.ok) {
        setSubmitError(
          result.error === "ALREADY_REGISTERED"
            ? t("alreadyRegistered")
            : result.error === "WAITLIST_FULL"
              ? t("waitlistFull")
              : t("submitError")
        );
        return;
      }

      if (typeof result.position !== "number" || !result.referralCode) {
        setSubmitError(t("submitError"));
        return;
      }

      setWaitlistResult({ position: result.position, referralCode: result.referralCode });
    } catch {
      setSubmitError(t("submitError"));
      return;
    } finally {
      setSubmitting(false);
    }

    if (cardRef.current) {
      gsap.to(".form-content", {
        opacity: 0,
        filter: "blur(10px)",
        y: -20,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
          setSubmitted(true);
          requestAnimationFrame(() => {
            if (successRef.current) {
              gsap.fromTo(
                successRef.current,
                { opacity: 0, filter: "blur(12px)", y: 20 },
                { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.6, ease: "power3.out" }
              );
            }
          });
        },
      });
    }
  }

  async function handleShare() {
    if (!waitlistResult) return;

    const shareUrl = `${window.location.origin}/?ref=${encodeURIComponent(waitlistResult.referralCode)}#inscription`;
    if (navigator.share) {
      await navigator.share({ title: "Onabaya", url: shareUrl });
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section ref={container} id="inscription" className="py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
        {/* Colonne gauche — texte + confiance */}
        <div>
          <h2 className="signup-title text-4xl use-tanker-font font-medium text-gray-900 dark:text-white leading-tight mb-4">
            {t("title")}
          </h2>
          <p className="signup-desc text-base leading-relaxed text-gray-500 dark:text-gray-400 mb-6">
            {t("description")}
          </p>

          <div className="flex flex-col gap-2.5">
            {(t.raw("trust") as string[]).map((point, i) => (
              <div
                key={i}
                className="trust-point flex items-center gap-2.5 text-base text-gray-500 dark:text-gray-400"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-900 dark:bg-white shrink-0" />
                {point}
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite — formulaire ou succès */}
        <div
          ref={cardRef}
          className="border-[1.5px] border-gray-900 dark:border-white rounded-[20px] p-9 bg-white dark:bg-gray-900 overflow-hidden shadow-sm"
        >
          {submitted ? (
            <div ref={successRef} className="text-center py-8">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                {t("thanks")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {t("success")}
              </p>
              {waitlistResult && (
                <div className="mt-5 flex flex-col items-center gap-3">
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {t("place", { value: waitlistResult.position })}
                  </p>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
                  >
                    {copied ? t("copied") : t("share")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="form-content flex flex-col gap-5">
              {submitError && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {submitError}
                </p>
              )}
              {/* Champ Nom */}
              <div className="field-group relative pl-3.5">
                <span className="active-indicator absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-0 bg-gray-900 dark:bg-white rounded-full opacity-0 transition-all" />
                <label
                  htmlFor="nom"
                  className="block text-base font-medium text-gray-900 dark:text-white mb-1.5 transition-transform"
                >
                  {t("name")}
                </label>
                <input
                  id="nom"
                  name="nom"
                  type="text"
                  value={formData.nom}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  required
                  placeholder={t("fullName")}
                  className="w-full px-3.5 py-3 text-sm border-[1.5px] border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-gray-900 dark:focus:border-white placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-colors"
                />
              </div>

              {/* Champ Email */}
              <div className="field-group relative pl-3.5">
                <span className="active-indicator absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-0 bg-gray-900 dark:bg-white rounded-full opacity-0 transition-all" />
                <label
                  htmlFor="email"
                  className="block text-base font-medium text-gray-900 dark:text-white mb-1.5 transition-transform"
                >
                  {t("email")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  required
                  placeholder="vous@exemple.com"
                  className="w-full px-3.5 py-3 text-sm border-[1.5px] border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-gray-900 dark:focus:border-white placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-colors"
                />
              </div>

              {/* Select Rôle */}
              <div className="field-group relative pl-3.5">
                <span className="active-indicator absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-0 bg-gray-900 dark:bg-white rounded-full opacity-0 transition-all" />
                <label
                  htmlFor="role"
                  className="block text-base font-medium text-gray-900 dark:text-white mb-1.5 transition-transform"
                >
                  {t("role")}
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  required
                  className="w-full px-3.5 py-3 text-sm border-[1.5px] border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-gray-900 dark:focus:border-white appearance-none transition-colors"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='none' stroke='%236b7280' stroke-width='1.5' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                    paddingRight: "36px",
                  }}
                >
                  <option value="" disabled>
                    {t("selectRole")}
                  </option>
                  {(t.raw("roles") as string[]).map((label, index) => (
                    <option key={roleOptions[index].value} value={roleOptions[index].value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Champ Ville */}
              <div className="field-group relative pl-3.5">
                <span className="active-indicator absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 bg-gray-900 dark:bg-white rounded-full opacity-0 transition-all" />
                <label
                  htmlFor="ville"
                  className="block text-base font-medium text-gray-900 dark:text-white mb-1.5 transition-transform"
                >
                  {t("city")}
                </label>
                <input
                  id="ville"
                  name="ville"
                  type="text"
                  value={formData.ville}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  required
                  placeholder={t("cityPlaceholder")}
                  className="w-full px-3.5 py-3 text-sm border-[1.5px] border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-gray-900 dark:focus:border-white placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="submit-btn w-full py-3.5 text-base font-medium rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 cursor-pointer mt-1 transition-colors"
              >
                {submitting ? t("submitting") : t("submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}