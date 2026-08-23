"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Purchase, PurchaseItem, PurchaseStatus } from "@/lib/database.types";
import { PURCHASE_STATUS, PURCHASE_STATUS_LABEL, PURCHASE_STATUS_TONE } from "@/lib/estoque";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { formatCurrency, formatDate } from "@/lib/utils";

type Option = { id: string; nome: string };
type ProductOption = { id: string; nome: string; unidade: string; valor_unitario: number | null };

export function PurchaseDetail({
  purchase,
  suppliers,
  products,
}: {
  purchase: Purchase;
  suppliers: Option[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<PurchaseStatus>(purchase.status);
  const [supplierId, setSupplierId] = useState(purchase.supplier_id ?? "");
  const [dataPrevista, setDataPrevista] = useState(purchase.data_prevista_entrega ?? "");
  const [observacoes, setObservacoes] = useState(purchase.observacoes ?? "");
  const [itens, setItens] = useState<PurchaseItem[]>(purchase.itens);
  const [newProductId, setNewProductId] = useState("");
  const [saving, setSaving] = useState(false);
  const [recebendo, setRecebendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valorTotal = useMemo(() => itens.reduce((sum, i) => sum + i.valor_total, 0), [itens]);

  function addItem() {
    const product = products.find((p) => p.id === newProductId);
    if (!product) return;
    setItens((prev) => [
      ...prev,
      {
        produto_id: product.id,
        produto_nome: product.nome,
        quantidade: 1,
        valor_unitario: product.valor_unitario ?? 0,
        valor_total: product.valor_unitario ?? 0,
      },
    ]);
    setNewProductId("");
  }

  function updateItem(index: number, field: "quantidade" | "valor_unitario", value: number) {
    setItens((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, [field]: value };
        next.valor_total = next.quantidade * next.valor_unitario;
        return next;
      })
    );
  }

  function removeItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    await supabase
      .from("purchases")
      .update({
        supplier_id: supplierId || null,
        data_prevista_entrega: dataPrevista || null,
        observacoes: observacoes || null,
        itens,
        valor_total: valorTotal,
      })
      .eq("id", purchase.id);
    setSaving(false);
    router.refresh();
  }

  async function handleStatusChange(newStatus: PurchaseStatus) {
    setStatus(newStatus);
    await supabase.from("purchases").update({ status: newStatus }).eq("id", purchase.id);
    router.refresh();
  }

  async function handleReceber() {
    if (itens.length === 0) {
      setError("Adicione ao menos um item antes de marcar como recebido.");
      return;
    }
    setRecebendo(true);
    setError(null);

    // Garante que os itens e o total estejam salvos antes de gerar as entradas de estoque.
    await supabase
      .from("purchases")
      .update({ supplier_id: supplierId || null, itens, valor_total: valorTotal })
      .eq("id", purchase.id);

    const movements = itens.map((item) => ({
      product_id: item.produto_id,
      tipo: "entrada" as const,
      quantidade: item.quantidade,
      motivo: "compra" as const,
      purchase_id: purchase.id,
      observacoes: `Recebimento da compra #${purchase.numero}`,
    }));
    const { error: movementError } = await supabase.from("stock_movements").insert(movements);

    if (movementError) {
      setError(movementError.message);
      setRecebendo(false);
      return;
    }

    await supabase
      .from("purchases")
      .update({ status: "recebido", data_recebimento: new Date().toISOString().slice(0, 10) })
      .eq("id", purchase.id);

    setStatus("recebido");
    setRecebendo(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={`Compra #${purchase.numero}`}
          subtitle={suppliers.find((s) => s.id === supplierId)?.nome}
          action={
            <div className="flex items-center gap-2">
              <Select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as PurchaseStatus)}
                disabled={status === "recebido"}
              >
                {PURCHASE_STATUS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
              <Badge tone={PURCHASE_STATUS_TONE[status]}>{PURCHASE_STATUS_LABEL[status]}</Badge>
            </div>
          }
        />
        <CardBody className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FieldGroup label="Fornecedor">
              <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} disabled={status === "recebido"}>
                <option value="">Selecione...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup label="Previsão de entrega">
              <Input type="date" value={dataPrevista} onChange={(e) => setDataPrevista(e.target.value)} disabled={status === "recebido"} />
            </FieldGroup>
            <FieldGroup label="Data de recebimento">
              <Input value={purchase.data_recebimento ? formatDate(purchase.data_recebimento) : "-"} disabled />
            </FieldGroup>
          </div>
          <FieldGroup label="Observações">
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} disabled={status === "recebido"} />
          </FieldGroup>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Itens" />
        <CardBody className="space-y-4">
          {status !== "recebido" && (
            <div className="flex gap-2">
              <Select value={newProductId} onChange={(e) => setNewProductId(e.target.value)} className="flex-1">
                <option value="">Adicionar produto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </Select>
              <Button type="button" variant="outline" onClick={addItem} disabled={!newProductId}>+ Item</Button>
            </div>
          )}

          {itens.length === 0 ? (
            <p className="text-sm text-muted">Nenhum item adicionado ainda.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="py-2 font-medium">Produto</th>
                  <th className="py-2 font-medium">Qtd.</th>
                  <th className="py-2 font-medium">Valor unit.</th>
                  <th className="py-2 text-right font-medium">Total</th>
                  {status !== "recebido" && <th className="py-2"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {itens.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 text-foreground">{item.produto_nome}</td>
                    <td className="py-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantidade}
                        onChange={(e) => updateItem(i, "quantidade", Number(e.target.value))}
                        disabled={status === "recebido"}
                        className="w-20"
                      />
                    </td>
                    <td className="py-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.valor_unitario}
                        onChange={(e) => updateItem(i, "valor_unitario", Number(e.target.value))}
                        disabled={status === "recebido"}
                        className="w-28"
                      />
                    </td>
                    <td className="py-2 text-right text-muted">{formatCurrency(item.valor_total)}</td>
                    {status !== "recebido" && (
                      <td className="py-2 text-right">
                        <button type="button" onClick={() => removeItem(i)} className="text-xs text-red-600 hover:underline">
                          remover
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex justify-end border-t border-border pt-3">
            <p className="text-base font-semibold text-foreground">
              Valor total: <span className="text-primary">{formatCurrency(valorTotal)}</span>
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            {status !== "recebido" && (
              <>
                <Button variant="outline" onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
                <Button onClick={handleReceber} disabled={recebendo}>
                  {recebendo ? "Recebendo..." : "Marcar como recebido"}
                </Button>
              </>
            )}
          </div>
          {status === "recebido" && (
            <p className="text-sm text-green-700">
              ✓ Compra recebida em {formatDate(purchase.data_recebimento)} — estoque atualizado automaticamente.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
