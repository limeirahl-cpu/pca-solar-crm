"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Client, Lead, Quote, QuoteItem, QuoteStatus } from "@/lib/database.types";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { formatCurrency, formatDate } from "@/lib/utils";

type QuoteWithRelations = Quote & { clients: Client | null; leads: Lead | null };

const STATUS_OPTIONS: { value: QuoteStatus; label: string; tone: "neutral" | "amber" | "green" | "red" | "blue" }[] = [
  { value: "rascunho", label: "Rascunho", tone: "neutral" },
  { value: "enviado", label: "Enviado", tone: "blue" },
  { value: "aprovado", label: "Aprovado", tone: "green" },
  { value: "recusado", label: "Recusado", tone: "red" },
  { value: "expirado", label: "Expirado", tone: "amber" },
];

type ItemForm = { descricao: string; quantidade: string; valor_unitario: string };

export function QuoteDetail({ quote, items }: { quote: QuoteWithRelations; items: QuoteItem[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<QuoteStatus>(quote.status);
  const [editingItems, setEditingItems] = useState(false);
  const [itemForms, setItemForms] = useState<ItemForm[]>(
    items.map((it) => ({
      descricao: it.descricao,
      quantidade: String(it.quantidade),
      valor_unitario: String(it.valor_unitario),
    }))
  );
  const [savingItems, setSavingItems] = useState(false);

  const contactName = quote.clients?.nome ?? quote.leads?.nome ?? "Sem cliente vinculado";

  const total = useMemo(
    () =>
      itemForms.reduce((sum, item) => {
        const qty = Number(item.quantidade) || 0;
        const unit = Number(item.valor_unitario) || 0;
        return sum + qty * unit;
      }, 0),
    [itemForms]
  );

  async function handleStatusChange(newStatus: QuoteStatus) {
    setStatus(newStatus);
    await supabase.from("quotes").update({ status: newStatus }).eq("id", quote.id);
    router.refresh();
  }

  function updateItem(index: number, patch: Partial<ItemForm>) {
    setItemForms((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItemForms((prev) => [...prev, { descricao: "", quantidade: "1", valor_unitario: "" }]);
  }

  function removeItem(index: number) {
    setItemForms((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveItems() {
    setSavingItems(true);
    await supabase.from("quote_items").delete().eq("quote_id", quote.id);

    const payload = itemForms
      .filter((it) => it.descricao.trim())
      .map((it, index) => ({
        quote_id: quote.id,
        descricao: it.descricao,
        quantidade: Number(it.quantidade) || 1,
        valor_unitario: Number(it.valor_unitario) || 0,
        valor_total: (Number(it.quantidade) || 1) * (Number(it.valor_unitario) || 0),
        ordem: index,
      }));

    if (payload.length > 0) {
      await supabase.from("quote_items").insert(payload);
    }

    await supabase.from("quotes").update({ valor_total: total }).eq("id", quote.id);

    setSavingItems(false);
    setEditingItems(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={`Orçamento #${quote.numero}`}
          subtitle={contactName}
          action={
            <div className="flex items-center gap-2 print:hidden">
              <Select value={status} onChange={(e) => handleStatusChange(e.target.value as QuoteStatus)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                Imprimir / PDF
              </Button>
            </div>
          }
        />
        <CardBody>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Info label="Potência" value={quote.potencia_kwp ? `${quote.potencia_kwp} kWp` : "-"} />
            <Info label="Painéis" value={quote.quantidade_paineis ? String(quote.quantidade_paineis) : "-"} />
            <Info label="Validade" value={`${quote.validade_dias} dias`} />
            <Info label="Criado em" value={formatDate(quote.created_at)} />
            <Info label="Forma de pagamento" value={quote.forma_pagamento || "-"} className="col-span-2" />
            <Info label="Status" value="" className="hidden print:block">
              <Badge>{STATUS_OPTIONS.find((s) => s.value === status)?.label}</Badge>
            </Info>
          </div>
          {quote.observacoes && (
            <p className="mt-4 text-sm text-muted">
              <span className="font-medium text-foreground">Observações: </span>
              {quote.observacoes}
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Itens"
          action={
            !editingItems ? (
              <Button size="sm" variant="outline" onClick={() => setEditingItems(true)} className="print:hidden">
                Editar itens
              </Button>
            ) : (
              <div className="flex gap-2 print:hidden">
                <Button size="sm" variant="outline" onClick={() => setEditingItems(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={saveItems} disabled={savingItems}>
                  {savingItems ? "Salvando..." : "Salvar itens"}
                </Button>
              </div>
            )
          }
        />
        <CardBody>
          {!editingItems ? (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="py-2 font-medium">Descrição</th>
                  <th className="py-2 font-medium">Qtd.</th>
                  <th className="py-2 font-medium">Valor unit.</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {itemForms.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 text-foreground">{item.descricao}</td>
                    <td className="py-2 text-muted">{item.quantidade}</td>
                    <td className="py-2 text-muted">{formatCurrency(Number(item.valor_unitario))}</td>
                    <td className="py-2 text-right text-muted">
                      {formatCurrency((Number(item.quantidade) || 0) * (Number(item.valor_unitario) || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="space-y-3">
              {itemForms.map((item, index) => (
                <div key={index} className="grid grid-cols-12 items-end gap-2">
                  <div className="col-span-6">
                    <Input
                      value={item.descricao}
                      onChange={(e) => updateItem(index, { descricao: e.target.value })}
                      placeholder="Descrição"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.quantidade}
                      onChange={(e) => updateItem(index, { quantidade: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.valor_unitario}
                      onChange={(e) => updateItem(index, { valor_unitario: e.target.value })}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button type="button" variant="danger" size="sm" onClick={() => removeItem(index)}>
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                + Adicionar item
              </Button>
            </div>
          )}

          <div className="mt-4 flex justify-end border-t border-border pt-3">
            <p className="text-base font-semibold text-foreground">
              Total: <span className="text-primary">{formatCurrency(total)}</span>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Info({
  label,
  value,
  className,
  children,
}: {
  label: string;
  value: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      {children ?? <p className="text-sm text-foreground">{value}</p>}
    </div>
  );
}
