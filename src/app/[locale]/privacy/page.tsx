"use client";

export const runtime = "edge";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Database, Cookie, Lock, Eye, Trash2, FileText } from "lucide-react";

export default function PrivacyPage() {
  const t = useTranslations("privacy");

  const sections = [
    {
      icon: Database,
      key: "dataCollection",
      items: [
        "personalInfo",
        "authInfo",
        "gameData",
        "analyticsData"
      ]
    },
    {
      icon: Cookie,
      key: "cookies",
      items: [
        "essential",
        "analytics",
        "preferences"
      ]
    },
    {
      icon: FileText,
      key: "dataUsage",
      items: [
        "authentication",
        "gamification",
        "improvement",
        "communication"
      ]
    },
    {
      icon: Shield,
      key: "thirdParty",
      items: [
        "github",
        "googleAnalytics",
        "cloudflare"
      ]
    },
    {
      icon: Lock,
      key: "dataRetention",
      items: [
        "accountData",
        "analytics",
        "deletion"
      ]
    },
    {
      icon: Eye,
      key: "userRights",
      items: [
        "access",
        "rectification",
        "erasure",
        "portability",
        "objection"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              <h1 className="text-4xl font-bold">{t("title")}</h1>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">
              {t("lastUpdated")}: February 1, 2026
            </p>
            <p className="mt-4 text-zinc-700 dark:text-zinc-300 max-w-2xl mx-auto">
              {t("intro")}
            </p>
          </div>

          {/* Overview */}
          <Card className="mb-8 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                {t("overview.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-700 dark:text-zinc-300">
                {t("overview.description")}
              </p>
            </CardContent>
          </Card>

          {/* Sections */}
          {sections.map(({ icon: Icon, key, items }) => (
            <Card key={key} className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                  {t(`sections.${key}.title`)}
                </CardTitle>
                <CardDescription>
                  {t(`sections.${key}.description`)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                      <div className="flex-1">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {t(`sections.${key}.items.${item}.title`)}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                          {t(`sections.${key}.items.${item}.description`)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}

          {/* Security */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
                {t("sections.security.title")}
              </CardTitle>
              <CardDescription>
                {t("sections.security.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-700 dark:text-zinc-300">
                {t("sections.security.content")}
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                {t("sections.contact.title")}
              </CardTitle>
              <CardDescription>
                {t("sections.contact.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-zinc-700 dark:text-zinc-300">
                <p>{t("sections.contact.content")}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  <a
                    href="mailto:privacy@mcpchallenge.com"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    privacy@mcpchallenge.com
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                {t("sections.changes.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-700 dark:text-zinc-300">
                {t("sections.changes.content")}
              </p>
            </CardContent>
          </Card>

          {/* Footer note */}
          <div className="mt-12 p-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("footer")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
