"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to sign in");
        setLoading(false);
        return;
      }

      router.push("/paper");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] p-6 shadow-sm sm:p-10">
      <div className="space-y-2 mb-6">
        <span className="font-ui text-xs font-semibold uppercase tracking-widest text-[#9B1C1C]">
          Welcome Back
        </span>
        <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#1B1A17]">
          Sign in to your paper
        </h2>
        <p className="font-body text-sm text-[#6B655C]">
          Enter your email to open your custom morning edition. No password required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="signin-email"
            className="block font-ui text-xs font-semibold uppercase tracking-wider text-[#6B655C]"
          >
            Email Address
          </label>
          <Input
            id="signin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. ayesha@example.com"
            className="h-12 border-[#D9CFBF] bg-[#FAF5EC] text-base focus-visible:ring-[#9B1C1C]"
            autoFocus
          />
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-[#9B1C1C] text-white hover:bg-[#801616] h-11 font-ui text-sm font-semibold tracking-wide"
          >
            {loading ? "Opening paper..." : "Open my paper"}
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-[#D9CFBF] pt-4 text-center">
        <Link
          href="/onboarding"
          className="font-ui text-xs text-[#8A5A2B] hover:text-[#9B1C1C] hover:underline"
        >
          New here? Brew my paper
        </Link>
      </div>
    </div>
  );
}
