"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

export type FortlevKitComponent = {
  component: { id: string; name: string; family: string | null; code: string | null };
  quantity: number;
};

export type FortlevKit = {
  final_price: number;
  full_price: number;
  discount: number;
  power: number;
  voltage: string;
  phase: number;
  pv_kit_components: FortlevKitComponent[];
};

type FortlevOrderResult = { final_price: number; full_price: number; power: number; pv_kits: FortlevKit[] };

/** Extrai o nome do primeiro componente de uma família (module/inverter) num kit, para preencher marca/modelo. */
export function nomeComponente(kit: FortlevKit, familia: "module" | "inverter"): string {
  return kit.pv_kit_components.find((c) => c.component.family === familia)?.component.name ?? "";
}

export function resumoComponentes(kit: FortlevKit): string {
  return kit.pv_kit_components
    .filter((c) => c.component.family === "module" || c.component.family === "inverter")
    .map((c) => `${c.quantity}x ${c.component.name}`)
    .join(" · ");
}

/**
 * Busca cotações reais de kits fotovoltaicos completos na API oficial da Fortlev
 * Solar (preço + equipamentos), para uma potência/cidade/ligação já calculadas
 * pelo simulador ou digitadas no orçamento. Não funciona sem a integração
 * configurada em Admin → Integrações.
 */
export function FortlevKitSearch({
  potenciaKwp,
  cidade,
  fases,
  onSelectKit,
}: {
  potenciaKwp: number;
  cidade?: string;
  fases: number;
  onSelectKit: (kit: FortlevKit) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kits, setKits] = useState<FortlevKit[] | null>(null);
  const [selecionado, setSelecionado] = useState<number | null>(null);

  async function buscar() {
    setLoading(true);
    setError(null);
    setKits(null);
    setSelecionado(null);
    try {
      const res = await fetch("/api/integracoes/fortlev/kits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          power: potenciaKwp,
          phase: fases,
          voltage: fases >= 3 ? "380" : "220",
          city: cidade || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Falha ao buscar kits da Fortlev Solar.");
        return;
      }
      const todosKits: FortlevKit[] = (data.orders ?? []).flatMap(
        (o: FortlevOrderResult) => o.pv_kits ?? []
      );
      if (todosKits.length === 0) {
        setError("A Fortlev não retornou kits disponíveis para essa potência/cidade.");
      }
      setKits(todosKits);
    } catch {
      setError("Falha de conexão com a Fortlev Solar.");
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader
        title="Cotar kit da Fortlev Solar"
        subtitle="Preço e equipamentos reais, direto da API oficial do fornecedor — atualizado na hora."
      />
      <CardBody className="space-y-4">
        <Button type="button" variant="outline" onClick={buscar} disabled={loading || !potenciaKwp}>
          {loading ? "Buscando..." : "Buscar kits para esta potência"}
        </Button>

        {!potenciaKwp && (
          <p className="text-xs text-muted">Calcule a potência do sistema antes de buscar kits.</p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}

        {kits && kits.length > 0 && (
          <ul className="space-y-2">
            {kits.map((kit, i) => (
              <li
                key={i}
                className={`rounded-lg border p-3 ${
                  selecionado === i ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{kit.power.toFixed(2)} kWp</p>
                    <p className="truncate text-xs text-muted">{resumoComponentes(kit)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="text-base font-semibold text-primary">{formatCurrency(kit.final_price)}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant={selecionado === i ? "primary" : "outline"}
                      onClick={() => {
                        setSelecionado(i);
                        onSelectKit(kit);
                      }}
                    >
                      {selecionado === i ? "Selecionado ✓" : "Usar este kit"}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
