import React from "react";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
  ruleColor?: string;
}

export default function SectionLabel({
  children,
  className = "",
  ruleColor = "#9B1C1C",
}: SectionLabelProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="font-ui text-xs font-bold uppercase tracking-[0.15em] text-[#9B1C1C]">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="h-[2px] w-5 rounded-full inline-block"
        style={{ backgroundColor: ruleColor }}
      />
    </div>
  );
}
