import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FAQStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import Link from "next/link";

export const runtime = "edge";

const BASE_URL = "https://mcpchallenge.org";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions",
  description:
    "Common questions about MCP Challenge, Model Context Protocol, how to play challenges, connect AI agents, and earn achievements.",
  openGraph: {
    title: "FAQ - MCP Challenge",
    description:
      "Common questions about MCP Challenge, Model Context Protocol, and how to get started.",
    url: `${BASE_URL}/faq`,
    siteName: "MCP Challenge",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "FAQ - MCP Challenge",
    description: "Common questions about MCP Challenge and Model Context Protocol.",
  },
};

interface FAQItem {
  question: string;
  answer: string;
}

export default async function FAQPage() {
  const t = await getTranslations("faq");

  const faqCategories = [
    {
      titleKey: "basics.title",
      items: [
        { questionKey: "basics.q1", answerKey: "basics.a1" },
        { questionKey: "basics.q2", answerKey: "basics.a2" },
        { questionKey: "basics.q3", answerKey: "basics.a3" },
      ],
    },
    {
      titleKey: "technical.title",
      items: [
        { questionKey: "technical.q1", answerKey: "technical.a1" },
        { questionKey: "technical.q2", answerKey: "technical.a2" },
        { questionKey: "technical.q3", answerKey: "technical.a3" },
      ],
    },
    {
      titleKey: "gameplay.title",
      items: [
        { questionKey: "gameplay.q1", answerKey: "gameplay.a1" },
        { questionKey: "gameplay.q2", answerKey: "gameplay.a2" },
        { questionKey: "gameplay.q3", answerKey: "gameplay.a3" },
      ],
    },
    {
      titleKey: "developers.title",
      items: [
        { questionKey: "developers.q1", answerKey: "developers.a1" },
        { questionKey: "developers.q2", answerKey: "developers.a2" },
        { questionKey: "developers.q3", answerKey: "developers.a3" },
      ],
    },
  ];

  // Build FAQ items for structured data
  const allFaqItems: FAQItem[] = faqCategories.flatMap((category) =>
    category.items.map((item) => ({
      question: t(item.questionKey),
      answer: t(item.answerKey),
    }))
  );

  return (
    <>
      <FAQStructuredData items={allFaqItems} />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: BASE_URL },
          { name: "FAQ", url: `${BASE_URL}/faq` },
        ]}
      />

      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 mb-6">
              <HelpCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              {t("title")}
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-8">
            {faqCategories.map((category, categoryIndex) => (
              <div
                key={categoryIndex}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
              >
                <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {t(category.titleKey)}
                  </h2>
                </div>
                <Accordion type="single" collapsible className="px-6">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem
                      key={itemIndex}
                      value={`${categoryIndex}-${itemIndex}`}
                      className="border-zinc-200 dark:border-zinc-800"
                    >
                      <AccordionTrigger className="text-left text-zinc-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400">
                        {t(item.questionKey)}
                      </AccordionTrigger>
                      <AccordionContent className="text-zinc-600 dark:text-zinc-400">
                        {t(item.answerKey)}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          {/* Contact section */}
          <div className="mt-12 text-center p-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              {t("contact.title")}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              {t("contact.description")}
            </p>
            <a
              href="https://discord.gg/nxunUEA8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              {t("contact.discord")}
            </a>
          </div>

          {/* Back link */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
            >
              {t("backHome")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
