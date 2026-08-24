import { cn } from "@/lib/utils";

type Tone = "neutral" | "amber" | "green" | "red" | "blue" | "teal";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-stone-100 text-stone-700",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  teal: "bg-teal-100 text-teal-800",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
