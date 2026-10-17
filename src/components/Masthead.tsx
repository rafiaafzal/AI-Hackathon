import TodayDate from "./TodayDate";
import Rule from "./Rule";

interface MastheadProps {
  name?: string;
  className?: string;
}

export default function Masthead({ name, className = "" }: MastheadProps) {
  return (
    <header className={`w-full text-center pt-8 pb-4 ${className}`}>
      <h1 className="font-headline text-5xl sm:text-7xl font-bold tracking-tight text-[var(--cn-ink,#1B1A17)]">
        Chai &amp; News
      </h1>
      <Rule double className="mt-3 mb-2" />
      <div className="font-ui flex flex-wrap items-center justify-between gap-2 py-1 text-xs uppercase tracking-widest text-[var(--cn-muted,#6B655C)]">
        <div className="min-w-[120px] text-left">
          <TodayDate />
        </div>
        <span className="font-headline italic normal-case text-sm tracking-normal text-[var(--cn-chai,#8A5A2B)]">
          Your morning paper, brewed fresh.
        </span>
        <div className="min-w-[120px] text-right font-medium">
          {name ? <span>Prepared for {name}</span> : <span>Daily Edition</span>}
        </div>
      </div>
      <Rule className="mt-2 mb-4" />
    </header>
  );
}
