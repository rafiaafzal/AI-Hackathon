import React from "react";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export default function SectionLabel({
  children,
  className = "",
}: SectionLabelProps) {
  return (
    <span
      className={`font-ui inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cn-accent,#9B1C1C)] ${className}`}
    >
      {children}
    </span>
  );
}
