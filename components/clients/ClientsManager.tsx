"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Client, TipoPessoa } from "@/lib/database.types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";

const emptyForm = {
  tipo_pessoa: "fisica" as TipoPessoa,
  nome: "",
  documento: "",
  email: "",
  telefone: "",
  endereco: "",
  cidade: "",
  estado: "",
  cep: "",
  observacoes: "",
};

export function ClientsManager({ initialClients }: { initialClients: Client[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return clients.filter(
      (c) =>
        !search ||
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        (c.documento ?? "").includes(search) ||
        (c.email ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [clients, search]);

  function openNew() {
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      tipo_pessoa: form.tipo_pessoa,
      nome: form.nome,
      documento: form.documento || null,
      email: form.email || null,
      telefone: form.telefone || null,
      endereco: form.endereco || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      cep: form.cep || null,
      observacoes: form.observacoes || null,
    };

    const { data, error } = await supabase.from("clients").insert(payload).select().single();
    if (error) {
      setError(error.message);
    } else if (data) {
      setClients((prev) => [data, ...prev]);
      setModalOpen(false);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Buscar por nome, documento ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-sm"
          />
          <Button onClick={openNew}>+ Novo cliente</Button>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Cadastre um novo cliente ou converta um lead na aba Leads."
            action={<Button onClick={openNew}>+ Novo cliente</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Documento</th>
                  <th className="px-5 py-3 font-medium">Contato</th>
                  <th className="px-5 py-3 font-medium">Cidade/UF</th>
                  <th className="px-5 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-black/[0.02]">
                    <td className="px-5 py-3 font-medium text-foreground">{client.nome}</td>
                    <td className="px-5 py-3">
                      <Badge tone={client.tipo_pessoa === "juridica" ? "blue" : "neutral"}>
                        {client.tipo_pessoa === "juridica" ? "Jurídica" : "Física"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-muted">{client.documento || "-"}</td>
                    <td className="px-5 py-3 text-muted">
                      <div>{client.telefone || "-"}</div>
                      <div className="text-xs">{client.email || ""}</div>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {[client.cidade, client.estado].filter(Boolean).join("/") || "-"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/clientes/${client.id}`}>
                        <Button size="sm" variant="outline">
                          Ver detalhes
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo cliente">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Tipo">
              <Select
                value={form.tipo_pessoa}
                onChange={(e) => setForm({ ...form, tipo_pessoa: e.target.value as TipoPessoa })}
              >
                <option value="fisica">Pessoa física</option>
                <option value="juridica">Pessoa jurídica</option>
              </Select>
            </FieldGroup>
            <FieldGroup label="Documento (CPF/CNPJ)">
              <Input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
            </FieldGroup>
          </div>

          <FieldGroup label="Nome / Razão social" required>
            <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Telefone">
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
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
              <Input
                maxLength={2}
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
              />
            </FieldGroup>
          </div>

          <FieldGroup label="CEP">
            <Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} />
          </FieldGroup>

          <FieldGroup label="Observações">
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </FieldGroup>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
