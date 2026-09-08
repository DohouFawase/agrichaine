"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
import { cookiesContent } from "@/i18n/legal-pages";

export default function CookiesPage() {
  const { locale } = useLocale();
  const content = cookiesContent[locale];

  return (
    <main className="max-w-2xl mx-auto px-4 py-20">
      <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-6">{content.title}</h1>
      <div className="flex flex-col gap-6 text-base leading-relaxed text-gray-600 dark:text-gray-400">
        {content.sections.map(([heading, body], index) => (
          <section key={heading}>
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{heading}</h2>
            <p>
              {body}
              {index === content.sections.length - 1 && " "}
              {index === content.sections.length - 1 && <a href={`mailto:${content.contact}`} className="text-gray-900 dark:text-white underline underline-offset-2">{content.contact}</a>}
            </p>
          </section>
        ))}
      </div>
      <Link href="/" className="inline-block mt-10 text-sm font-medium text-gray-900 dark:text-white underline underline-offset-4">{content.back}</Link>
    </main>
  );
}
