import { cn } from "@/lib/utils";

/** Renders button text on one line (≤2 words) or two balanced lines (>2 words). */
export function ButtonLabelRows({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const words = label.trim().split(/\s+/);
  if (words.length <= 2) {
    return <span className={className}>{label}</span>;
  }

  const firstLineCount = Math.ceil(words.length / 2);
  const line1 = words.slice(0, firstLineCount).join(" ");
  const line2 = words.slice(firstLineCount).join(" ");

  return (
    <span className={cn("flex flex-col items-center text-center leading-tight", className)}>
      <span>{line1}</span>
      <span>{line2}</span>
    </span>
  );
}
