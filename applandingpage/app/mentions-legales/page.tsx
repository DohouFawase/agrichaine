"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
import { legalNoticeContent } from "@/i18n/legal-pages";

export default function MentionsLegalesPage() {
  const { locale } = useLocale();
  const content = legalNoticeContent[locale];

  return (
    <main className="max-w-2xl mx-auto px-4 py-20">
      <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-6">{content.title}</h1>
      <div className="flex flex-col gap-6 text-base leading-relaxed text-gray-600 dark:text-gray-400">
        {content.sections.map(([heading, body]) => (
          <section key={heading}>
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{heading}</h2>
            <p>{body}</p>
          </section>
        ))}
      </div>
      <Link href="/" className="inline-block mt-10 text-sm font-medium text-gray-900 dark:text-white underline underline-offset-4">{content.back}</Link>
    </main>
  );
}
