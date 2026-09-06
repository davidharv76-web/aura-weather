import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function MetricTile({
  icon: Icon,
  label,
  value,
  note,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note?: string;
  className?: string;
}) {
  return (
    <div className={cn("glass rounded-2xl p-4", className)}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-accent" />
        {label}
      </div>
      <p className="tabular mt-2.5 font-display text-2xl leading-none">{value}</p>
      {note && <p className="mt-1.5 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
        )}
        <h2 className="mt-1 text-2xl sm:text-[1.7rem]">{title}</h2>
      </div>
      {right}
    </div>
  );
}
