"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Purchase } from "@/lib/database.types";
import { PURCHASE_STATUS_LABEL, PURCHASE_STATUS_TONE } from "@/lib/estoque";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { formatCurrency, formatDate } from "@/lib/utils";

export type PurchaseWithSupplier = Purchase & { suppliers: { nome: string } | null };
type Option = { id: string; nome: string };

export function PurchasesManager({
  initialPurchases,
  suppliers,
}: {
  initialPurchases: PurchaseWithSupplier[];
  suppliers: Option[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [purchases] = useState(initialPurchases);
  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [dataPrevista, setDataPrevista] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("purchases")
      .insert({
        supplier_id: supplierId || null,
        data_prevista_entrega: dataPrevista || null,
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setError(insertError?.message || "Não foi possível criar o pedido de compra.");
      setSaving(false);
      return;
    }
    router.push(`/compras/${data.id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Compras</h1>
          <p className="text-sm text-muted">Pedidos de compra para fornecedores, do rascunho ao recebimento.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nova compra</Button>
      </div>

      <Card>
        {purchases.length === 0 ? (
          <EmptyState
            title="Nenhum pedido de compra"
            description="Abra um pedido para começar a controlar suas compras de equipamentos e materiais."
            action={<Button onClick={() => setModalOpen(true)}>+ Nova compra</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Nº</th>
                  <th className="px-5 py-3 font-medium">Fornecedor</th>
                  <th className="px-5 py-3 font-medium">Data do pedido</th>
                  <th className="px-5 py-3 font-medium">Valor total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-black/[0.02]">
                    <td className="px-5 py-3 text-muted">
                      <Link href={`/compras/${p.id}`} className="font-medium text-foreground hover:underline">
                        #{p.numero}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">{p.suppliers?.nome ?? "-"}</td>
                    <td className="px-5 py-3 text-muted">{formatDate(p.data_pedido)}</td>
                    <td className="px-5 py-3 text-muted">{formatCurrency(p.valor_total)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={PURCHASE_STATUS_TONE[p.status]}>{PURCHASE_STATUS_LABEL[p.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova compra">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <FieldGroup label="Fornecedor">
            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">Selecione depois</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Previsão de entrega">
            <Input type="date" value={dataPrevista} onChange={(e) => setDataPrevista(e.target.value)} />
          </FieldGroup>
          <p className="text-xs text-muted">Os itens são adicionados na tela seguinte.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Criando..." : "Criar pedido"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
