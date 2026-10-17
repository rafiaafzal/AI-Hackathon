"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export interface NavUser {
  id: string;
  name: string | null;
  email: string | null;
}

interface SiteNavClientProps {
  user: NavUser | null;
  todayEditionId: string | null;
}

export default function SiteNavClient({ user, todayEditionId }: SiteNavClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Never render top nav inside print view
  if (pathname?.startsWith("/print")) {
    return null;
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
    } finally {
      setIsSigningOut(false);
    }
  };

  const isPaperActive = pathname === "/paper" || pathname.startsWith("/paper/");
  const isArchiveActive = pathname === "/archive" || pathname.startsWith("/archive");
  const isProfileActive = pathname === "/profile";
  const isSignInActive = pathname === "/signin";
  const isOnboardingActive = pathname === "/onboarding";

  const linkClass = (active: boolean) =>
    `min-h-[44px] inline-flex items-center font-ui [font-variant-caps:all-small-caps] tracking-wider text-sm transition-all duration-200 ease-out px-1 border-b-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] focus-visible:ring-offset-1 rounded-xs ${
      active
        ? "text-[#9B1C1C] border-[#9B1C1C] font-bold"
        : "text-[#6B655C] border-transparent hover:text-[#1B1A17] hover:border-[#8A5A2B]"
    }`;

  const homeHref = user ? "/paper" : "/";

  return (
    <header className="border-b border-[#D9CFBF] bg-[#FAF5EC] print:hidden sticky top-0 z-40">
      <div className="mx-auto max-w-5xl px-4 sm:px-8">
        <div className="flex items-center justify-between gap-4 py-1 overflow-x-auto whitespace-nowrap">
          {/* Logo */}
          <Link
            href={homeHref}
            className="min-h-[44px] inline-flex items-center font-headline text-lg sm:text-xl font-bold text-[#1B1A17] hover:text-[#9B1C1C] transition-colors shrink-0 gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] rounded-xs"
          >
            <span>Chai &amp; News</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-3 sm:gap-6 shrink-0" aria-label="Main Navigation">
            {user ? (
              <>
                <Link href="/paper" className={linkClass(isPaperActive)}>
                  Today
                </Link>
                <Link href="/archive" className={linkClass(isArchiveActive)}>
                  Archive
                </Link>
                <Link href="/profile" className={linkClass(isProfileActive)}>
                  Profile
                </Link>
                {todayEditionId && (
                  <a
                    href={`/api/edition/${todayEditionId}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] inline-flex items-center font-ui [font-variant-caps:all-small-caps] tracking-wider text-sm text-[#6B655C] border-b-2 border-transparent hover:text-[#1B1A17] hover:border-[#8A5A2B] transition-all duration-200 ease-out px-1 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] focus-visible:ring-offset-1"
                  >
                    Download PDF
                  </a>
                )}
                <div className="h-4 w-px bg-[#D9CFBF] shrink-0" />
                <span className="font-ui text-xs text-[#8A5A2B] font-medium hidden md:inline shrink-0">
                  {user.name || user.email || "Reader"}
                </span>
                <Link
                  href="/onboarding?new=1"
                  className={linkClass(isOnboardingActive && pathname.includes("new=1"))}
                  title="Brew a new newspaper"
                >
                  Brew a new paper
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="btn-press min-h-[44px] inline-flex items-center font-ui [font-variant-caps:all-small-caps] tracking-wider text-sm text-[#9B1C1C] hover:text-[#7D1616] transition-colors px-1 disabled:opacity-50 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] rounded-xs"
                >
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </button>
              </>
            ) : (
              <>
                <Link href="/signin" className={linkClass(isSignInActive)}>
                  Sign in
                </Link>
                <Link
                  href="/onboarding"
                  className="btn-press min-h-[44px] inline-flex items-center font-ui [font-variant-caps:all-small-caps] tracking-wider text-sm rounded bg-[#9B1C1C] px-3.5 py-1 font-semibold text-white hover:bg-[#801616] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] focus-visible:ring-offset-1"
                >
                  Brew my paper
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
