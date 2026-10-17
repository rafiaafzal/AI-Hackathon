interface RuleProps {
  className?: string;
  double?: boolean;
}

export default function Rule({ className = "", double = false }: RuleProps) {
  if (double) {
    return (
      <div className={`my-3 border-t-4 border-double border-[var(--cn-ink,#1B1A17)] ${className}`} />
    );
  }

  return (
    <hr className={`my-3 border-0 border-t border-[var(--cn-rule,#D9CFBF)] ${className}`} />
  );
}
