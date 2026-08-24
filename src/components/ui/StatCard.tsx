import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "primary" | "accent";
}) {
  return (
    <Card className="group relative overflow-hidden p-5 transition-shadow hover:shadow-md">
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100",
          tone === "primary" && "bg-primary",
          tone === "accent" && "bg-accent",
          tone === "default" && "bg-border"
        )}
      />
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p
        className={cn(
          "font-tabular mt-2 text-[28px] leading-none font-semibold",
          tone === "primary" && "text-primary",
          tone === "accent" && "text-accent",
          tone === "default" && "text-foreground"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </Card>
  );
}
