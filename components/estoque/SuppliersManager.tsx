"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Supplier } from "@/lib/database.types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Textarea } from "@/components/ui/Field";

const emptyForm = {
  nome: "",
  cnpj_cpf: "",
  telefone: "",
  email: "",
  endereco: "",
  cidade: "",
  estado: "",
  contato_nome: "",
  observacoes: "",
};

export function SuppliersManager({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => suppliers.filter((s) => !search || s.nome.toLowerCase().includes(search.toLowerCase())),
    [suppliers, search]
  );

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditingId(s.id);
    setForm({
      nome: s.nome,
      cnpj_cpf: s.cnpj_cpf ?? "",
      telefone: s.telefone ?? "",
      email: s.email ?? "",
      endereco: s.endereco ?? "",
      cidade: s.cidade ?? "",
      estado: s.estado ?? "",
      contato_nome: s.contato_nome ?? "",
      observacoes: s.observacoes ?? "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      setError("Informe o nome do fornecedor.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      nome: form.nome,
      cnpj_cpf: form.cnpj_cpf || null,
      telefone: form.telefone || null,
      email: form.email || null,
      endereco: form.endereco || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      contato_nome: form.contato_nome || null,
      observacoes: form.observacoes || null,
    };

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from("suppliers")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();
      if (updateError) {
        setError(updateError.message);
      } else if (data) {
        setSuppliers((prev) => prev.map((s) => (s.id === editingId ? data : s)));
        setModalOpen(false);
      }
    } else {
      const { data, error: insertError } = await supabase.from("suppliers").insert(payload).select().single();
      if (insertError) {
        setError(insertError.message);
      } else if (data) {
        setSuppliers((prev) => [data, ...prev]);
        setModalOpen(false);
      }
    }
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Fornecedores</h1>
          <p className="text-sm text-muted">Fornecedores de equipamentos e materiais.</p>
        </div>
        <Button onClick={openNew}>+ Novo fornecedor</Button>
      </div>

      <Card className="p-4">
        <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-sm" />
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum fornecedor cadastrado"
            description="Cadastre os fornecedores de equipamentos e materiais."
            action={<Button onClick={openNew}>+ Novo fornecedor</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Fornecedor</th>
                  <th className="px-5 py-3 font-medium">Contato</th>
                  <th className="px-5 py-3 font-medium">Telefone</th>
                  <th className="px-5 py-3 font-medium">Cidade/UF</th>
                  <th className="px-5 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-black/[0.02]">
                    <td className="px-5 py-3 font-medium text-foreground">{s.nome}</td>
                    <td className="px-5 py-3 text-muted">{s.contato_nome ?? "-"}</td>
                    <td className="px-5 py-3 text-muted">{s.telefone ?? "-"}</td>
                    <td className="px-5 py-3 text-muted">{[s.cidade, s.estado].filter(Boolean).join("/") || "-"}</td>
                    <td className="px-5 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(s)}>Editar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar fornecedor" : "Novo fornecedor"}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <FieldGroup label="Nome" required>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="CNPJ/CPF">
              <Input value={form.cnpj_cpf} onChange={(e) => setForm({ ...form, cnpj_cpf: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Nome do contato">
              <Input value={form.contato_nome} onChange={(e) => setForm({ ...form, contato_nome: e.target.value })} />
            </FieldGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Telefone">
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Email">
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </FieldGroup>
          </div>
          <FieldGroup label="Endereço">
            <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
          </FieldGroup>
          <div className="grid grid-cols-3 gap-3">
            <FieldGroup label="Cidade" className="col-span-2">
              <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="UF">
              <Input maxLength={2} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })} />
            </FieldGroup>
          </div>
          <FieldGroup label="Observações">
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
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
