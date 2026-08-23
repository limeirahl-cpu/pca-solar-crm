"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { FinancialCategoriaTipo, FinancialCategory } from "@/lib/database.types";
import { FINANCIAL_TIPO_LABEL } from "@/lib/financeiro";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select } from "@/components/ui/Field";

export function CategoriesManager({ initialCategories }: { initialCategories: FinancialCategory[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<FinancialCategoriaTipo>("receita");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setError("Informe o nome da categoria.");
      return;
    }
    setSaving(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("financial_categories")
      .insert({ nome, tipo })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      setCategories((prev) => [...prev, data]);
      setModalOpen(false);
      setNome("");
      router.refresh();
    }
    setSaving(false);
  }

  const receitas = categories.filter((c) => c.tipo === "receita");
  const despesas = categories.filter((c) => c.tipo === "despesa");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Categorias financeiras</h1>
          <p className="text-sm text-muted">Classificação usada em contas a receber e a pagar.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nova categoria</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Receitas</h2>
          </div>
          {receitas.length === 0 ? (
            <EmptyState title="Nenhuma categoria de receita" />
          ) : (
            <ul className="divide-y divide-border">
              {receitas.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm text-foreground">
                  {c.nome}
                  <Badge tone="green">{FINANCIAL_TIPO_LABEL[c.tipo]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Despesas</h2>
          </div>
          {despesas.length === 0 ? (
            <EmptyState title="Nenhuma categoria de despesa" />
          ) : (
            <ul className="divide-y divide-border">
              {despesas.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm text-foreground">
                  {c.nome}
                  <Badge tone="amber">{FINANCIAL_TIPO_LABEL[c.tipo]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova categoria">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <FieldGroup label="Nome" required>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Tipo">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as FinancialCategoriaTipo)}>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </Select>
          </FieldGroup>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
