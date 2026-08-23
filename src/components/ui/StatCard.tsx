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
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold",
          tone === "primary" && "text-primary",
          tone === "accent" && "text-accent",
          tone === "default" && "text-foreground"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}
