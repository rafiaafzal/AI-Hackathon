"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SwitchReaderButton() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/onboarding");
      router.refresh();
    } catch {
      window.location.href = "/onboarding";
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={loading}
      className="border-[#D9CFBF] text-[#6B655C] hover:bg-[#FAF0E6] hover:text-[#9B1C1C] text-xs font-ui uppercase tracking-wider h-9"
    >
      {loading ? "Switching..." : "Switch Reader"}
    </Button>
  );
}
