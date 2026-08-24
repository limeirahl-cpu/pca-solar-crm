"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { StockMovement, StockMovementMotivo, StockMovementTipo } from "@/lib/database.types";
import { STOCK_MOVEMENT_MOTIVO, STOCK_MOVEMENT_TIPO } from "@/lib/estoque";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";

type ProductOption = { id: string; nome: string; unidade: string };

export function NewMovementModal({
  open,
  onClose,
  products,
  fixedProductId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  products: ProductOption[];
  fixedProductId?: string;
  onCreated: (movement: StockMovement) => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [productId, setProductId] = useState(fixedProductId ?? "");
  const [tipo, setTipo] = useState<StockMovementTipo>("entrada");
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState<StockMovementMotivo>("outro");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProductId = fixedProductId ?? productId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProductId) {
      setError("Selecione o produto.");
      return;
    }
    const qtd = Number(quantidade);
    if (!qtd || qtd <= 0) {
      setError("Informe uma quantidade válida.");
      return;
    }
    setSaving(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("stock_movements")
      .insert({
        product_id: selectedProductId,
        tipo,
        quantidade: qtd,
        motivo,
        observacoes: observacoes || null,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      onCreated(data);
      setQuantidade("");
      setObservacoes("");
      onClose();
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova movimentação de estoque">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!fixedProductId && (
          <FieldGroup label="Produto" required>
            <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Selecione...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </Select>
          </FieldGroup>
        )}
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Tipo">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as StockMovementTipo)}>
              {STOCK_MOVEMENT_TIPO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Quantidade" required>
            <Input type="number" step="0.01" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
          </FieldGroup>
        </div>
        <FieldGroup label="Motivo">
          <Select value={motivo} onChange={(e) => setMotivo(e.target.value as StockMovementMotivo)}>
            {STOCK_MOVEMENT_MOTIVO.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup label="Observações">
          <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </FieldGroup>
        {tipo === "ajuste" && (
          <p className="text-xs text-muted">
            Ajuste sempre soma a quantidade informada ao estoque atual — para reduzir, registre uma saída.
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Registrar"}</Button>
        </div>
      </form>
    </Modal>
  );
}
