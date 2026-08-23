"use client";

import { useState } from "react";
import Link from "next/link";
import type { StockMovement } from "@/lib/database.types";
import { STOCK_MOVEMENT_MOTIVO_LABEL, STOCK_MOVEMENT_TIPO_LABEL, STOCK_MOVEMENT_TIPO_TONE } from "@/lib/estoque";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewMovementModal } from "@/components/estoque/NewMovementModal";
import { formatDateTime } from "@/lib/utils";

export type MovementWithProduct = StockMovement & { products: { nome: string; unidade: string } | null };
type ProductOption = { id: string; nome: string; unidade: string };

export function StockMovementsManager({
  initialMovements,
  products,
}: {
  initialMovements: MovementWithProduct[];
  products: ProductOption[];
}) {
  const [movements, setMovements] = useState(initialMovements);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Movimentações de estoque</h1>
          <p className="text-sm text-muted">Histórico de entradas, saídas e ajustes de todos os produtos.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nova movimentação</Button>
      </div>

      <Card>
        {movements.length === 0 ? (
          <EmptyState
            title="Nenhuma movimentação registrada"
            description="Registre entradas e saídas para manter o estoque em dia."
            action={<Button onClick={() => setModalOpen(true)}>+ Nova movimentação</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Produto</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Quantidade</th>
                  <th className="px-5 py-3 font-medium">Motivo</th>
                  <th className="px-5 py-3 font-medium">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-black/[0.02]">
                    <td className="px-5 py-3 text-muted">{formatDateTime(m.created_at)}</td>
                    <td className="px-5 py-3 font-medium text-foreground">
                      <Link href={`/estoque/produtos/${m.product_id}`} className="hover:underline">
                        {m.products?.nome ?? "Produto"}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={STOCK_MOVEMENT_TIPO_TONE[m.tipo]}>{STOCK_MOVEMENT_TIPO_LABEL[m.tipo]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted">{m.quantidade} {m.products?.unidade ?? ""}</td>
                    <td className="px-5 py-3 text-muted">{STOCK_MOVEMENT_MOTIVO_LABEL[m.motivo]}</td>
                    <td className="px-5 py-3 text-muted">{m.observacoes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <NewMovementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        products={products}
        onCreated={(movement) => {
          const product = products.find((p) => p.id === movement.product_id);
          setMovements((prev) => [
            { ...movement, products: product ? { nome: product.nome, unidade: product.unidade } : null },
            ...prev,
          ]);
        }}
      />
    </div>
  );
}
