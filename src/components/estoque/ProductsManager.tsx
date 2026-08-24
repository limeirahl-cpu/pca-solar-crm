"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Product, ProductCategoria } from "@/lib/database.types";
import { PRODUCT_CATEGORIA, PRODUCT_CATEGORIA_LABEL, isEstoqueBaixo } from "@/lib/estoque";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { formatCurrency } from "@/lib/utils";

export type ProductWithSupplier = Product & { suppliers: { nome: string } | null };
type Option = { id: string; nome: string };

const emptyForm = {
  codigo: "",
  nome: "",
  categoria: "outro" as ProductCategoria,
  unidade: "un",
  fornecedor_id: "",
  estoque_minimo: "",
  valor_unitario: "",
  observacoes: "",
};

export function ProductsManager({
  initialProducts,
  suppliers,
  title,
  description,
  categoriaOptions,
}: {
  initialProducts: ProductWithSupplier[];
  suppliers: Option[];
  title: string;
  description: string;
  categoriaOptions?: ProductCategoria[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<ProductWithSupplier[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, categoria: categoriaOptions?.[0] ?? "outro" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = categoriaOptions
    ? PRODUCT_CATEGORIA.filter((c) => categoriaOptions.includes(c.value))
    : PRODUCT_CATEGORIA;

  const filtered = useMemo(
    () =>
      products.filter(
        (p) => !search || p.nome.toLowerCase().includes(search.toLowerCase()) || (p.codigo ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  function openNew() {
    setForm({ ...emptyForm, categoria: categoriaOptions?.[0] ?? "outro" });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      setError("Informe o nome do produto.");
      return;
    }
    setSaving(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("products")
      .insert({
        codigo: form.codigo || null,
        nome: form.nome,
        categoria: form.categoria,
        unidade: form.unidade || "un",
        fornecedor_id: form.fornecedor_id || null,
        estoque_minimo: form.estoque_minimo ? Number(form.estoque_minimo) : 0,
        valor_unitario: form.valor_unitario ? Number(form.valor_unitario) : null,
        observacoes: form.observacoes || null,
      })
      .select("*, suppliers(nome)")
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProducts((prev) => [data as any as ProductWithSupplier, ...prev]);
      setModalOpen(false);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <Button onClick={openNew}>+ Novo produto</Button>
      </div>

      <Card className="p-4">
        <Input
          placeholder="Buscar por nome ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-sm"
        />
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum produto cadastrado"
            description="Cadastre os produtos e equipamentos que você compra e instala."
            action={<Button onClick={openNew}>+ Novo produto</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Produto</th>
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className="px-5 py-3 font-medium">Fornecedor</th>
                  <th className="px-5 py-3 font-medium">Estoque</th>
                  <th className="px-5 py-3 font-medium">Valor unit.</th>
                  <th className="px-5 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const baixo = isEstoqueBaixo(p.estoque_atual, p.estoque_minimo);
                  return (
                    <tr key={p.id} className="hover:bg-black/[0.02]">
                      <td className="px-5 py-3 font-medium text-foreground">
                        {p.nome}
                        {p.codigo && <span className="ml-2 text-xs text-muted">{p.codigo}</span>}
                      </td>
                      <td className="px-5 py-3 text-muted">{PRODUCT_CATEGORIA_LABEL[p.categoria]}</td>
                      <td className="px-5 py-3 text-muted">{p.suppliers?.nome ?? "-"}</td>
                      <td className="px-5 py-3">
                        <span className={baixo ? "font-semibold text-red-600" : "text-foreground"}>
                          {p.estoque_atual} {p.unidade}
                        </span>
                        {baixo && <Badge tone="red" className="ml-2">Estoque baixo</Badge>}
                      </td>
                      <td className="px-5 py-3 text-muted">{p.valor_unitario ? formatCurrency(p.valor_unitario) : "-"}</td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/estoque/produtos/${p.id}`}>
                          <Button size="sm" variant="outline">Ver detalhes</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo produto">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Nome" required className="col-span-2">
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Código/SKU">
              <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Unidade">
              <Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} placeholder="un, m, kg..." />
            </FieldGroup>
          </div>
          <FieldGroup label="Categoria">
            <Select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as ProductCategoria })}>
              {options.map((c) => (
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
          <p className="text-xs text-muted">
            O produto começa com estoque zerado — registre a quantidade inicial como uma movimentação de entrada depois de criá-lo.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
