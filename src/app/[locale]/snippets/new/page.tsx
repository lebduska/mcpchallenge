"use client";

export const runtime = "edge";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Code2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const LANGUAGES = [
  { id: "json", name: "JSON" },
  { id: "typescript", name: "TypeScript" },
  { id: "javascript", name: "JavaScript" },
  { id: "python", name: "Python" },
  { id: "bash", name: "Bash" },
  { id: "yaml", name: "YAML" },
  { id: "markdown", name: "Markdown" },
];

export default function NewSnippetPage() {
  const t = useTranslations("snippets");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("json");
  const [code, setCode] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          language,
          code,
          isPublic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || "Failed to create snippet");
      }

      const data = await response.json() as { id: string };
      router.push(`/snippets/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/snippets"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToSnippets")}
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Code2 className="h-6 w-6 text-blue-500 dark:text-blue-400" />
            {t("newSnippet")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            {t("newSnippetDescription")}
          </p>
        </div>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">{t("form.title")}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("form.titlePlaceholder")}
                required
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("form.description")}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("form.descriptionPlaceholder")}
                rows={2}
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t("form.language")}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">{t("form.code")}</Label>
              <Textarea
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("form.codePlaceholder")}
                rows={12}
                required
                className="font-mono text-sm bg-zinc-950 text-zinc-300 border-zinc-800"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="public" className="cursor-pointer">
                  {t("form.public")}
                </Label>
              </div>

              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("form.submit")}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
