"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Lightbulb, Loader2 } from "lucide-react";
import Link from "next/link";

interface SubmitIdeaDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function SubmitIdeaDialog({ trigger, onSuccess }: SubmitIdeaDialogProps) {
  const { data: session } = useSession();
  const t = useTranslations("ideas");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("game");
  const [gameReference, setGameReference] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          gameReference: gameReference || null,
        }),
      });

      const data = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit idea");
      }

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("game");
      setGameReference("");
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="link" className="text-yellow-500 hover:text-yellow-400 p-0 h-auto">
      {t("submitIdea")}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            {t("submitTitle")}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {t("submitDescription")}
          </DialogDescription>
        </DialogHeader>

        {!session?.user ? (
          <div className="py-6 text-center">
            <p className="text-zinc-400 mb-4">{t("signInRequired")}</p>
            <Button asChild>
              <Link href="/auth/signin">{t("signIn")}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-zinc-300">{t("form.title")}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("form.titlePlaceholder")}
                className="bg-zinc-800 border-zinc-700 text-white"
                maxLength={100}
                required
              />
              <p className="text-xs text-zinc-500">{title.length}/100</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300">{t("form.description")}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("form.descriptionPlaceholder")}
                className="bg-zinc-800 border-zinc-700 text-white min-h-[120px]"
                maxLength={2000}
                required
              />
              <p className="text-xs text-zinc-500">{description.length}/2000</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-zinc-300">{t("form.category")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="game">{t("categories.game")}</SelectItem>
                    <SelectItem value="creative">{t("categories.creative")}</SelectItem>
                    <SelectItem value="puzzle">{t("categories.puzzle")}</SelectItem>
                    <SelectItem value="educational">{t("categories.educational")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference" className="text-zinc-300">{t("form.reference")}</Label>
                <Input
                  id="reference"
                  value={gameReference}
                  onChange={(e) => setGameReference(e.target.value)}
                  placeholder={t("form.referencePlaceholder")}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  maxLength={50}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-zinc-700 text-zinc-300"
              >
                {t("form.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || title.length < 5 || description.length < 20}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("form.submitting")}
                  </>
                ) : (
                  t("form.submit")
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
