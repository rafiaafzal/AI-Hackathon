"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TOPICS, Topic } from "@/lib/feeds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const TOPIC_DETAILS: Record<Topic, { label: string; emoji: string }> = {
  world: { label: "World", emoji: "🌍" },
  pakistan: { label: "Pakistan", emoji: "🇵🇰" },
  politics: { label: "Politics", emoji: "🏛️" },
  technology: { label: "Technology", emoji: "💻" },
  ai: { label: "AI", emoji: "🤖" },
  startups: { label: "Startups", emoji: "🚀" },
  business: { label: "Business", emoji: "📈" },
  finance: { label: "Finance", emoji: "💰" },
  cricket: { label: "Cricket", emoji: "🏏" },
  sports: { label: "Sports", emoji: "⚽" },
  science: { label: "Science", emoji: "🔬" },
  health: { label: "Health", emoji: "🩺" },
  climate: { label: "Climate", emoji: "🌿" },
  culture: { label: "Culture", emoji: "🎨" },
};

const EXAMPLE_ABOUTS = [
  "Software engineer into AI agents, startups, and weekend cricket.",
  "Finance professional tracking global markets, macro trends, and tech disruption.",
  "Doctor following public health breakthroughs, climate science, and world politics.",
  "Mujhe technology, startups aur Pakistan ke current affairs ka shauq hai.",
];

const ROTATING_MESSAGES = [
  "Reading 100+ headlines...",
  "Analyzing your reading interests...",
  "Choosing your front page...",
  "Brewing your morning edition...",
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);

  // Form State
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [topicDepth, setTopicDepth] = useState<Record<string, number>>({});
  const [about, setAbout] = useState<string>("");
  const [language, setLanguage] = useState<"english" | "urdu" | "roman_urdu" | "mixed">("english");
  const [region, setRegion] = useState<string>("Pakistan");
  const [deliveryTime, setDeliveryTime] = useState<string>("07:00");

  // Loading & Error States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState<number>(0);

  // Cycle brewing messages
  useEffect(() => {
    if (!isSubmitting) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isSubmitting]);

  const toggleTopic = (topic: Topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics((prev) => prev.filter((t) => t !== topic));
      setTopicDepth((prev) => {
        const next = { ...prev };
        delete next[topic];
        return next;
      });
    } else {
      setSelectedTopics((prev) => [...prev, topic]);
      setTopicDepth((prev) => ({ ...prev, [topic]: 0.5 }));
    }
  };

  const handleDepthChange = (topic: string, value: number) => {
    setTopicDepth((prev) => ({ ...prev, [topic]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        topics: selectedTopics,
        topicDepth,
        about: about.trim(),
        language,
        region,
        deliveryTime,
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create your profile");
      }

      // Smoothly redirect to personalized paper
      router.push("/paper");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(msg);
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF5EC] px-6 text-center">
        <div className="relative mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-[#FFFDF8] border border-[#D9CFBF] shadow-sm">
          {/* Steam animation */}
          <div className="absolute -top-3 flex gap-2">
            <span className="cn-steam inline-block h-6 w-1 rounded-full bg-[#8A5A2B]/40" />
            <span className="cn-steam inline-block h-8 w-1 rounded-full bg-[#8A5A2B]/60 [animation-delay:0.3s]" />
            <span className="cn-steam inline-block h-6 w-1 rounded-full bg-[#8A5A2B]/40 [animation-delay:0.6s]" />
          </div>
          <span className="text-4xl" role="img" aria-label="Chai Cup">
            ☕
          </span>
        </div>

        <h2 className="font-headline text-3xl font-bold text-[#1B1A17] sm:text-4xl">
          Brewing your first paper...
        </h2>
        <p className="mt-3 font-ui text-sm uppercase tracking-widest text-[#8A5A2B] h-6 transition-all duration-300">
          {ROTATING_MESSAGES[messageIndex]}
        </p>

        {submitError && (
          <div className="mt-8 max-w-md rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Something went wrong:</p>
            <p className="mt-1">{submitError}</p>
            <Button
              onClick={handleSubmit}
              className="mt-3 bg-[#9B1C1C] text-white hover:bg-[#801616]"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Progress Dots */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              s === step
                ? "w-8 bg-[#9B1C1C]"
                : s < step
                ? "w-2.5 bg-[#8A5A2B]"
                : "w-2.5 bg-[#D9CFBF]"
            }`}
          />
        ))}
      </div>

      {/* Main Card */}
      <div className="rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] p-6 shadow-sm sm:p-10 cn-fade">
        {/* Step 1: Name & Email */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="font-ui text-xs font-semibold uppercase tracking-widest text-[#9B1C1C]">
                Step 1 of 5
              </span>
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#1B1A17]">
                What should we call you?
              </h2>
              <p className="font-body text-sm text-[#6B655C]">
                We will print your name on the masthead and use your email to retrieve your paper.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name-input" className="block font-ui text-xs font-semibold uppercase tracking-wider text-[#6B655C]">
                  Your Name
                </label>
                <Input
                  id="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tariq, Ayesha, Omar"
                  className="h-12 border-[#D9CFBF] bg-[#FAF5EC] text-base focus-visible:ring-[#9B1C1C]"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email-input" className="block font-ui text-xs font-semibold uppercase tracking-wider text-[#6B655C]">
                  Your Email
                </label>
                <Input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ayesha@example.com"
                  className="h-12 border-[#D9CFBF] bg-[#FAF5EC] text-base focus-visible:ring-[#9B1C1C]"
                />
                <p className="font-ui text-[11px] text-[#8A5A2B]">
                  No passwords. Your email is your key to your daily paper.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                href="/signin"
                className="font-ui text-xs text-[#8A5A2B] hover:text-[#9B1C1C] hover:underline"
              >
                Already have a paper? Sign in
              </Link>
              <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
                <Button
                  disabled={name.trim().length === 0 || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())}
                  onClick={() => setStep(2)}
                  className="bg-[#9B1C1C] text-white hover:bg-[#801616] px-6 h-11 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto btn-press"
                >
                  Continue &rarr;
                </Button>
                {name.trim().length === 0 && (
                  <span className="font-ui text-[11px] text-[#8A5A2B]">Please enter your name</span>
                )}
                {name.trim().length > 0 && (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) && (
                  <span className="font-ui text-[11px] text-[#8A5A2B]">Please enter a valid email</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Topics */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-ui text-xs font-semibold uppercase tracking-widest text-[#9B1C1C]">
                  Step 2 of 5
                </span>
                <span className="font-ui text-xs font-bold text-[#8A5A2B]">
                  {selectedTopics.length} picked {selectedTopics.length < 3 && "(min 3)"}
                </span>
              </div>
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#1B1A17]">
                What do you like to read about?
              </h2>
              <p className="font-body text-sm text-[#6B655C]">
                Pick at least 3 topics to build your baseline newspaper sections.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
              {TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                const info = TOPIC_DETAILS[topic];

                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`btn-press flex items-center gap-2.5 rounded-sm p-3 text-left transition-all border ${
                      isSelected
                        ? "border-[#9B1C1C] bg-[#FAF0E6] text-[#9B1C1C] font-semibold ring-1 ring-[#9B1C1C]"
                        : "border-[#D9CFBF] bg-[#FAF5EC] text-[#1B1A17] hover:border-[#8A5A2B]"
                    }`}
                  >
                    <span className="text-xl">{info.emoji}</span>
                    <span className="font-headline text-sm capitalize">{info.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="btn-press border-[#D9CFBF] text-[#6B655C] hover:bg-[#FAF5EC]"
              >
                &larr; Back
              </Button>
              <div className="flex flex-col items-end gap-1">
                <Button
                  disabled={selectedTopics.length < 3}
                  onClick={() => setStep(3)}
                  className="btn-press bg-[#9B1C1C] text-white hover:bg-[#801616] px-6 h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue &rarr;
                </Button>
                {selectedTopics.length < 3 && (
                  <span className="font-ui text-[11px] text-[#8A5A2B]">
                    Pick at least {3 - selectedTopics.length} more {3 - selectedTopics.length === 1 ? "topic" : "topics"}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Depth */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="font-ui text-xs font-semibold uppercase tracking-widest text-[#9B1C1C]">
                Step 3 of 5
              </span>
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#1B1A17]">
                How deep do you go?
              </h2>
              <p className="font-body text-sm text-[#6B655C]">
                Set whether you want quick headline digests or thorough deep reads per topic.
              </p>
            </div>

            <div className="space-y-5 max-h-[340px] overflow-y-auto pr-2">
              {selectedTopics.map((topic) => {
                const info = TOPIC_DETAILS[topic];
                const val = topicDepth[topic] ?? 0.5;

                return (
                  <div
                    key={topic}
                    className="rounded border border-[#D9CFBF] bg-[#FAF5EC] p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-headline text-sm font-semibold capitalize text-[#1B1A17]">
                        {info.emoji} {info.label}
                      </span>
                      <span className="font-ui text-[11px] uppercase tracking-wider text-[#8A5A2B]">
                        {val < 0.35 ? "Headlines" : val > 0.65 ? "Deep Reads" : "Balanced"}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={val}
                      onChange={(e) =>
                        handleDepthChange(topic, parseFloat(e.target.value))
                      }
                      className="w-full accent-[#9B1C1C] cursor-pointer"
                    />

                    <div className="flex justify-between text-[11px] font-ui text-[#6B655C]">
                      <span>Headlines</span>
                      <span>Balanced</span>
                      <span>Deep reads</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="border-[#D9CFBF] text-[#6B655C] hover:bg-[#FAF5EC]"
              >
                &larr; Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                className="bg-[#9B1C1C] text-white hover:bg-[#801616] px-6 h-11"
              >
                Continue &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: About / Free Text */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="font-ui text-xs font-semibold uppercase tracking-widest text-[#9B1C1C]">
                Step 4 of 5
              </span>
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#1B1A17]">
                Tell us about yourself <span className="text-sm font-normal text-[#6B655C]">(optional)</span>
              </h2>
              <p className="font-body text-sm text-[#6B655C]">
                Our Gemini editor reads this to pick precise stories and avoid what you dislike. You can write in English, Urdu or Roman Urdu!
              </p>
            </div>

            <div className="space-y-3">
              <Textarea
                rows={4}
                value={about}
                onChange={(e) => setAbout(e.target.value.slice(0, 600))}
                placeholder="e.g. I'm a software engineer, into AI agents and startup funding, I follow cricket on weekends."
                className="border-[#D9CFBF] bg-[#FAF5EC] text-base focus-visible:ring-[#9B1C1C]"
              />
              <div className="flex justify-between text-xs text-[#6B655C]">
                <span>Accepts English, Urdu, Roman Urdu</span>
                <span>{about.length}/600</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-ui text-[11px] uppercase tracking-wider text-[#6B655C]">
                Or click an example to use it:
              </span>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_ABOUTS.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAbout(ex)}
                    className="rounded border border-[#D9CFBF] bg-[#FAF5EC] px-2.5 py-1 text-left text-xs text-[#1B1A17] hover:border-[#9B1C1C] hover:bg-[#FAF0E6] transition"
                  >
                    &ldquo;{ex.length > 55 ? ex.slice(0, 52) + "..." : ex}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(3)}
                className="border-[#D9CFBF] text-[#6B655C] hover:bg-[#FAF5EC]"
              >
                &larr; Back
              </Button>
              <Button
                onClick={() => setStep(5)}
                className="bg-[#9B1C1C] text-white hover:bg-[#801616] px-6 h-11"
              >
                Continue &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Final Preferences */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="font-ui text-xs font-semibold uppercase tracking-widest text-[#9B1C1C]">
                Step 5 of 5
              </span>
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#1B1A17]">
                Last details
              </h2>
              <p className="font-body text-sm text-[#6B655C]">
                Fine-tune your language, geographic lens, and morning delivery schedule.
              </p>
            </div>

            <div className="space-y-4">
              {/* Language */}
              <div className="space-y-1.5">
                <label className="font-ui text-xs font-bold uppercase tracking-wider text-[#1B1A17]">
                  Language
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "english", label: "English" },
                      { id: "urdu", label: "Urdu" },
                      { id: "roman_urdu", label: "Roman Urdu" },
                      { id: "mixed", label: "Mixed" },
                    ] as const
                  ).map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLanguage(l.id)}
                      className={`rounded-sm border p-2.5 text-center text-sm font-ui transition ${
                        language === l.id
                          ? "border-[#9B1C1C] bg-[#FAF0E6] font-semibold text-[#9B1C1C]"
                          : "border-[#D9CFBF] bg-[#FAF5EC] text-[#1B1A17] hover:border-[#8A5A2B]"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Region */}
              <div className="space-y-1.5">
                <label className="font-ui text-xs font-bold uppercase tracking-wider text-[#1B1A17]">
                  Primary Region Focus
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full h-11 rounded-sm border border-[#D9CFBF] bg-[#FAF5EC] px-3 font-ui text-sm text-[#1B1A17] focus:border-[#9B1C1C] focus:outline-none"
                >
                  <option value="Pakistan">Pakistan</option>
                  <option value="South Asia">South Asia</option>
                  <option value="Middle East">Middle East</option>
                  <option value="Europe">Europe</option>
                  <option value="North America">North America</option>
                  <option value="Global">Global</option>
                </select>
              </div>

              {/* Delivery Time */}
              <div className="space-y-1.5">
                <label className="font-ui text-xs font-bold uppercase tracking-wider text-[#1B1A17]">
                  Morning Paper Delivery Time
                </label>
                <Input
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="h-11 border-[#D9CFBF] bg-[#FAF5EC] font-ui text-sm focus-visible:ring-[#9B1C1C]"
                />
              </div>
            </div>

            {submitError && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>{submitError}</span>
                {submitError.includes("sign in") || submitError.includes("Sign in") ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/signin")}
                    className="border-red-300 text-red-800 hover:bg-red-100 text-xs h-7 px-2 shrink-0"
                  >
                    Go to Sign In &rarr;
                  </Button>
                ) : null}
              </div>
            )}

            <div className="pt-4 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(4)}
                className="border-[#D9CFBF] text-[#6B655C] hover:bg-[#FAF5EC]"
              >
                &larr; Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-[#9B1C1C] text-white hover:bg-[#801616] px-6 h-11"
              >
                Brew My Paper &rarr;
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
