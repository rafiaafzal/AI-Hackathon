"use client";

import { useEffect, useState } from "react";

export default function TodayDate() {
  const [dateStr, setDateStr] = useState<string>("");

  useEffect(() => {
    setDateStr(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    );
  }, []);

  return <span>{dateStr || "\u00A0"}</span>;
}
