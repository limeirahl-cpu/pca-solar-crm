"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Product, ProductCategoria, StockMovement, StockReservation } from "@/lib/database.types";
import {
  PRODUCT_CATEGORIA,
  PRODUCT_CATEGORIA_LABEL,
  STOCK_MOVEMENT_MOTIVO_LABEL,
  STOCK_MOVEMENT_TIPO_LABEL,
  STOCK_MOVEMENT_TIPO_TONE,
  STOCK_RESERVATION_STATUS_LABEL,
  STOCK_RESERVATION_STATUS_TONE,
  isEstoqueBaixo,
} from "@/lib/estoque";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { NewMovementModal } from "@/components/estoque/NewMovementModal";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type Option = { id: string; nome: string };

export function ProductDetail({
  product,
  suppliers,
  movements,
  reservations,
}: {
  product: Product;
  suppliers: Option[];
  movements: StockMovement[];
  reservations: StockReservation[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nome: product.nome,
    codigo: product.codigo ?? "",
    categoria: product.categoria,
    unidade: product.unidade,
    fornecedor_id: product.fornecedor_id ?? "",
    estoque_minimo: String(product.estoque_minimo),
    valor_unitario: product.valor_unitario !== null ? String(product.valor_unitario) : "",
    observacoes: product.observacoes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [items, setItems] = useState(movements);
  const [estoqueAtual, setEstoqueAtual] = useState(product.estoque_atual);

  const baixo = isEstoqueBaixo(estoqueAtual, product.estoque_minimo);

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("products")
      .update({
        nome: form.nome,
        codigo: form.codigo || null,
        categoria: form.categoria,
        unidade: form.unidade || "un",
        fornecedor_id: form.fornecedor_id || null,
        estoque_minimo: form.estoque_minimo ? Number(form.estoque_minimo) : 0,
        valor_unitario: form.valor_unitario ? Number(form.valor_unitario) : null,
        observacoes: form.observacoes || null,
      })
      .eq("id", product.id);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={product.nome}
          subtitle={PRODUCT_CATEGORIA_LABEL[product.categoria]}
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setMovementModalOpen(true)}>+ Movimentação</Button>
              {!editing && (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Editar</Button>
              )}
            </div>
          }
        />
        <CardBody>
          <div className="mb-4 flex items-center gap-3">
            <p className="text-2xl font-semibold text-foreground">
              {estoqueAtual} <span className="text-base font-normal text-muted">{product.unidade}</span>
            </p>
            {baixo && <Badge tone="red">Estoque abaixo do mínimo ({product.estoque_minimo} {product.unidade})</Badge>}
          </div>

          {!editing ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Código" value={product.codigo} />
              <Info label="Categoria" value={PRODUCT_CATEGORIA_LABEL[product.categoria]} />
              <Info label="Fornecedor" value={suppliers.find((s) => s.id === product.fornecedor_id)?.nome} />
              <Info label="Estoque mínimo" value={`${product.estoque_minimo} ${product.unidade}`} />
              <Info label="Valor unitário" value={product.valor_unitario ? formatCurrency(product.valor_unitario) : null} />
              <Info label="Observações" value={product.observacoes} className="sm:col-span-2 lg:col-span-3" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Nome" className="col-span-2">
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Código/SKU">
                  <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Unidade">
                  <Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} />
                </FieldGroup>
              </div>
              <FieldGroup label="Categoria">
                <Select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as ProductCategoria })}>
                  {PRODUCT_CATEGORIA.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Fornecedor">
                <Select value={form.fornecedor_id} onChange={(e) => setForm({ ...form, fornecedor_id: e.target.value })}>
                  <option value="">Sem fornecedor definido</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </Select>
              </FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Estoque mínimo">
                  <Input type="number" step="0.01" value={form.estoque_minimo} onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Valor unitário">
                  <Input type="number" step="0.01" value={form.valor_unitario} onChange={(e) => setForm({ ...form, valor_unitario: e.target.value })} />
                </FieldGroup>
              </div>
              <FieldGroup label="Observações">
                <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </FieldGroup>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Movimentações" subtitle="Histórico de entradas, saídas e ajustes deste produto" />
        <CardBody className="p-0">
          {items.length === 0 ? (
            <EmptyState title="Nenhuma movimentação ainda" />
          ) : (
            <ul className="divide-y divide-border">
              {items.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <Badge tone={STOCK_MOVEMENT_TIPO_TONE[m.tipo]}>{STOCK_MOVEMENT_TIPO_LABEL[m.tipo]}</Badge>
                    <span className="ml-2 text-sm text-foreground">{m.quantidade} {product.unidade}</span>
                    <span className="ml-2 text-xs text-muted">{STOCK_MOVEMENT_MOTIVO_LABEL[m.motivo]}</span>
                  </div>
                  <span className="text-xs text-muted">{formatDateTime(m.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {reservations.length > 0 && (
        <Card>
          <CardHeader title="Reservas" subtitle="Quantidades reservadas para projetos" />
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {reservations.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-foreground">{r.quantidade} {product.unidade}</span>
                  <Badge tone={STOCK_RESERVATION_STATUS_TONE[r.status]}>{STOCK_RESERVATION_STATUS_LABEL[r.status]}</Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <NewMovementModal
        open={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        products={[{ id: product.id, nome: product.nome, unidade: product.unidade }]}
        fixedProductId={product.id}
        onCreated={(movement) => {
          setItems((prev) => [movement, ...prev]);
          setEstoqueAtual((prev) =>
            movement.tipo === "entrada" ? prev + movement.quantidade
            : movement.tipo === "saida" ? prev - movement.quantidade
            : prev + movement.quantidade
          );
        }}
      />
    </div>
  );
}

function Info({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm text-foreground">{value || "-"}</p>
    </div>
  );
}
