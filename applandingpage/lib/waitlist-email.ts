import { Resend } from "resend";
import type { Locale } from "@/i18n/messages";

const emailCopy = {
  fr: {
    subject: "Votre place dans la liste d'attente Onabaya",
    title: "Votre inscription est confirmée",
    position: (value: number) => `Vous êtes la personne n°${value} sur la liste d'attente.`,
    share: "Partagez Onabaya avec vos proches :",
    button: "Découvrir Onabaya",
  },
  en: {
    subject: "Your place on the Onabaya waiting list",
    title: "Your registration is confirmed",
    position: (value: number) => `You are person #${value} on the waiting list.`,
    share: "Share Onabaya with people you know:",
    button: "Discover Onabaya",
  },
  es: {
    subject: "Tu lugar en la lista de espera de Onabaya",
    title: "Tu inscripción está confirmada",
    position: (value: number) => `Eres la persona nº${value} en la lista de espera.`,
    share: "Comparte Onabaya con tus contactos:",
    button: "Descubrir Onabaya",
  },
} satisfies Record<Locale, { subject: string; title: string; position: (value: number) => string; share: string; button: string }>;

export async function sendWaitlistConfirmation({
  email,
  name,
  locale,
  position,
  referralCode,
}: {
  email: string;
  name: string;
  locale: Locale;
  position: number;
  referralCode: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!apiKey || !from) {
    console.warn("Resend environment variables are missing; confirmation email skipped");
    return false;
  }

  const copy = emailCopy[locale];
  const shareUrl = `${siteUrl}/?ref=${encodeURIComponent(referralCode)}#inscription`;
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: copy.subject,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:auto">
        <h1>${copy.title}, ${escapeHtml(name)}.</h1>
        <p>${copy.position(position)}</p>
        <p>${copy.share}</p>
        <p><a href="${shareUrl}" style="display:inline-block;background:#111827;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">${copy.button}</a></p>
        <p style="font-size:12px;color:#6b7280">${shareUrl}</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend waitlist email failed", error);
    return false;
  }

  return true;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}
