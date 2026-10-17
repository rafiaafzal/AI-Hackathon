"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ProfileRefineSection() {
  const router = useRouter();
  const [about, setAbout] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!about.trim()) return;

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/profile/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ about }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setSuccessMessage("Your profile preferences have been successfully updated!");
        setAbout("");
        router.refresh();
      } else {
        setErrorMessage(data.error || "Failed to update profile. Please try again.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Network error: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] p-6 sm:p-8 space-y-4">
      <div className="border-b border-[#D9CFBF] pb-2">
        <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[#9B1C1C]">
          Refine Your Reading Preferences
        </span>
        <h3 className="font-headline text-2xl font-bold text-[#1B1A17] mt-1">
          Tell us more about you
        </h3>
        <p className="font-ui text-xs text-[#6B655C] mt-1">
          Share your evolving passions, specific niche topics, or what kind of news you want to see more of in your morning brew.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="e.g. I am currently following advances in quantum computing, global supply chains, and cricket..."
          rows={3}
          maxLength={1000}
          className="w-full bg-[#FAF5EC] border-[#D9CFBF] font-body text-sm text-[#1B1A17] focus:border-[#9B1C1C] focus:ring-[#9B1C1C]"
        />

        {successMessage && (
          <div className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 font-ui text-xs text-emerald-800">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 font-ui text-xs text-rose-800">
            {errorMessage}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSaving || !about.trim()}
            className="bg-[#9B1C1C] hover:bg-[#7D1616] text-white font-ui text-xs font-semibold px-4 py-2"
          >
            {isSaving ? "Updating Preferences..." : "Save Preferences"}
          </Button>
        </div>
      </form>
    </section>
  );
}
