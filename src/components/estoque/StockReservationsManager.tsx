"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { StockReservation, StockReservationStatus } from "@/lib/database.types";
import { STOCK_RESERVATION_STATUS, STOCK_RESERVATION_STATUS_LABEL, STOCK_RESERVATION_STATUS_TONE } from "@/lib/estoque";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { formatDate } from "@/lib/utils";

export type ReservationWithRelations = StockReservation & {
  products: { nome: string; unidade: string } | null;
  projects: { nome: string } | null;
};
type ProductOption = { id: string; nome: string; unidade: string };
type ProjectOption = { id: string; nome: string };

export function StockReservationsManager({
  initialReservations,
  products,
  projects,
  defaultProjectId,
  autoOpen,
}: {
  initialReservations: ReservationWithRelations[];
  products: ProductOption[];
  projects: ProjectOption[];
  defaultProjectId?: string;
  autoOpen?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [reservations, setReservations] = useState(initialReservations);
  const [modalOpen, setModalOpen] = useState(Boolean(autoOpen));
  const [form, setForm] = useState({ product_id: "", project_id: defaultProjectId ?? "", quantidade: "", observacoes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.product_id) {
      setError("Selecione o produto.");
      return;
    }
    const qtd = Number(form.quantidade);
    if (!qtd || qtd <= 0) {
      setError("Informe uma quantidade válida.");
      return;
    }
    setSaving(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("stock_reservations")
      .insert({
        product_id: form.product_id,
        project_id: form.project_id || null,
        quantidade: qtd,
        observacoes: form.observacoes || null,
      })
      .select("*, products(nome, unidade), projects(nome)")
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setReservations((prev) => [data as any as ReservationWithRelations, ...prev]);
      setModalOpen(false);
      setForm({ product_id: "", project_id: defaultProjectId ?? "", quantidade: "", observacoes: "" });
      router.refresh();
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: StockReservationStatus) {
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await supabase.from("stock_reservations").update({ status }).eq("id", id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reservas de estoque</h1>
          <p className="text-sm text-muted">Quantidades reservadas para projetos aprovados, sem baixar o estoque ainda.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nova reserva</Button>
      </div>

      <Card>
        {reservations.length === 0 ? (
          <EmptyState
            title="Nenhuma reserva registrada"
            description="Reserve produtos para um projeto sem tirá-los do estoque ainda."
            action={<Button onClick={() => setModalOpen(true)}>+ Nova reserva</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Produto</th>
                  <th className="px-5 py-3 font-medium">Projeto</th>
                  <th className="px-5 py-3 font-medium">Quantidade</th>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-black/[0.02]">
                    <td className="px-5 py-3 font-medium text-foreground">{r.products?.nome ?? "-"}</td>
                    <td className="px-5 py-3 text-muted">{r.projects?.nome ?? "-"}</td>
                    <td className="px-5 py-3 text-muted">{r.quantidade} {r.products?.unidade ?? ""}</td>
                    <td className="px-5 py-3 text-muted">{formatDate(r.created_at)}</td>
                    <td className="px-5 py-3">
                      <Select
                        value={r.status}
                        onChange={(e) => updateStatus(r.id, e.target.value as StockReservationStatus)}
                        className="w-36"
                      >
                        {STOCK_RESERVATION_STATUS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </Select>
                      <Badge tone={STOCK_RESERVATION_STATUS_TONE[r.status]} className="ml-2">
                        {STOCK_RESERVATION_STATUS_LABEL[r.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova reserva">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <FieldGroup label="Produto" required>
            <Select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
              <option value="">Selecione...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Projeto (opcional)">
            <Select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">Nenhum projeto vinculado</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Quantidade" required>
            <Input type="number" step="0.01" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="Observações">
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </FieldGroup>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Reservar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
