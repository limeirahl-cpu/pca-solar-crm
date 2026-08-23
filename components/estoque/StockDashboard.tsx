import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { STOCK_MOVEMENT_TIPO_LABEL, STOCK_MOVEMENT_TIPO_TONE, isEstoqueBaixo } from "@/lib/estoque";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Product, StockMovement } from "@/lib/database.types";

type ProductLite = Pick<Product, "id" | "nome" | "unidade" | "estoque_atual" | "estoque_minimo" | "valor_unitario">;
type MovementWithProduct = StockMovement & { products: { nome: string; unidade: string } | null };

const SHORTCUTS = [
  { href: "/estoque/produtos", label: "Produtos", icon: "📦" },
  { href: "/estoque/equipamentos", label: "Equipamentos", icon: "⚙️" },
  { href: "/estoque/movimentacoes", label: "Movimentações", icon: "🔁" },
  { href: "/estoque/reservas", label: "Reservas", icon: "🔒" },
  { href: "/compras", label: "Compras", icon: "🛒" },
  { href: "/fornecedores", label: "Fornecedores", icon: "🚚" },
];

export function StockDashboard({
  products,
  recentMovements,
}: {
  products: ProductLite[];
  recentMovements: MovementWithProduct[];
}) {
  const produtosBaixo = products.filter((p) => isEstoqueBaixo(p.estoque_atual, p.estoque_minimo));
  const valorEmEstoque = products.reduce((sum, p) => sum + p.estoque_atual * (p.valor_unitario ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Estoque</h1>
        <p className="text-sm text-muted">Visão geral de produtos, movimentações e compras.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Produtos cadastrados" value={String(products.length)} tone="primary" />
        <StatCard
          label="Com estoque baixo"
          value={String(produtosBaixo.length)}
          tone={produtosBaixo.length > 0 ? "primary" : "default"}
        />
        <StatCard label="Valor em estoque" value={formatCurrency(valorEmEstoque)} tone="accent" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {SHORTCUTS.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="flex flex-col items-center gap-1 p-4 text-center hover:bg-black/[0.02]">
              <span className="text-xl">{s.icon}</span>
              <span className="text-sm font-medium text-foreground">{s.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      {produtosBaixo.length > 0 && (
        <Card>
          <CardHeader title="Produtos com estoque baixo" subtitle="Abaixo do mínimo definido" />
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {produtosBaixo.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <Link href={`/estoque/produtos/${p.id}`} className="text-sm font-medium text-foreground hover:underline">
                    {p.nome}
                  </Link>
                  <span className="text-sm text-red-600">
                    {p.estoque_atual}/{p.estoque_minimo} {p.unidade}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Movimentações recentes"
          action={
            <Link href="/estoque/movimentacoes" className="text-sm font-medium text-primary hover:underline">
              Ver todas
            </Link>
          }
        />
        <CardBody className="p-0">
          {recentMovements.length === 0 ? (
            <EmptyState title="Nenhuma movimentação registrada ainda" />
          ) : (
            <ul className="divide-y divide-border">
              {recentMovements.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <span className="text-sm font-medium text-foreground">{m.products?.nome ?? "Produto"}</span>
                    <span className="ml-2 text-xs text-muted">{formatDateTime(m.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">{m.quantidade} {m.products?.unidade ?? ""}</span>
                    <Badge tone={STOCK_MOVEMENT_TIPO_TONE[m.tipo]}>{STOCK_MOVEMENT_TIPO_LABEL[m.tipo]}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
