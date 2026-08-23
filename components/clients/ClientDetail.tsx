"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Client, Interaction, InteractionTipo, Plant, Quote } from "@/lib/database.types";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { formatCurrency, formatDateTime, initials } from "@/lib/utils";

const QUOTE_STATUS_TONE: Record<string, "neutral" | "amber" | "green" | "red" | "blue" | "teal"> = {
  rascunho: "neutral",
  enviado: "blue",
  aprovado: "green",
  recusado: "red",
  expirado: "amber",
};

const PLANT_STATUS_TONE: Record<string, "neutral" | "amber" | "green" | "red"> = {
  ativa: "green",
  manutencao: "amber",
  inativa: "red",
};

const INTERACTION_LABEL: Record<InteractionTipo, string> = {
  nota: "Nota",
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  email: "Email",
  visita: "Visita",
};

export function ClientDetail({
  client,
  quotes,
  plants,
  interactions,
}: {
  client: Client;
  quotes: Quote[];
  plants: Plant[];
  interactions: Interaction[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nome: client.nome,
    email: client.email ?? "",
    telefone: client.telefone ?? "",
    documento: client.documento ?? "",
    endereco: client.endereco ?? "",
    cidade: client.cidade ?? "",
    estado: client.estado ?? "",
    cep: client.cep ?? "",
    observacoes: client.observacoes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState<Interaction[]>(interactions);
  const [noteType, setNoteType] = useState<InteractionTipo>("nota");
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("clients")
      .update({
        nome: form.nome,
        email: form.email || null,
        telefone: form.telefone || null,
        documento: form.documento || null,
        endereco: form.endereco || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        cep: form.cep || null,
        observacoes: form.observacoes || null,
      })
      .eq("id", client.id);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAddingNote(true);
    const { data, error } = await supabase
      .from("interactions")
      .insert({ client_id: client.id, tipo: noteType, descricao: noteText })
      .select()
      .single();
    if (!error && data) {
      setItems((prev) => [data, ...prev]);
      setNoteText("");
    }
    setAddingNote(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={client.nome}
          subtitle={client.tipo_pessoa === "juridica" ? "Pessoa jurídica" : "Pessoa física"}
          action={
            <div className="flex gap-2">
              <Link href={`/simulador?client_id=${client.id}`}>
                <Button size="sm" variant="outline">
                  Simular sistema
                </Button>
              </Link>
              <Link href={`/orcamentos/novo?client_id=${client.id}`}>
                <Button size="sm" variant="secondary">
                  + Orçamento
                </Button>
              </Link>
              <Link href={`/usinas?novo=1&client_id=${client.id}`}>
                <Button size="sm" variant="outline">
                  + Usina
                </Button>
              </Link>
              <Link href={`/ordens-servico?novo=1&client_id=${client.id}`}>
                <Button size="sm" variant="outline">
                  + O.S.
                </Button>
              </Link>
              <Link href={`/pos-venda?client_id=${client.id}`}>
                <Button size="sm" variant="outline">
                  Pós-venda
                </Button>
              </Link>
              <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
                {editing ? "Fechar" : "Editar"}
              </Button>
            </div>
          }
        />
        <CardBody>
          {!editing ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Documento" value={client.documento} />
              <Info label="Telefone" value={client.telefone} />
              <Info label="Email" value={client.email} />
              <Info label="Endereço" value={client.endereco} />
              <Info label="Cidade/UF" value={[client.cidade, client.estado].filter(Boolean).join("/")} />
              <Info label="CEP" value={client.cep} />
              <Info label="Observações" value={client.observacoes} className="sm:col-span-2 lg:col-span-3" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Nome">
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Documento">
                  <Input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
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
                  <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })} />
                </FieldGroup>
              </div>
              <FieldGroup label="CEP">
                <Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Observações">
                <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </FieldGroup>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Orçamentos" />
          <CardBody className="p-0">
            {quotes.length === 0 ? (
              <EmptyState title="Nenhum orçamento para este cliente" />
            ) : (
              <ul className="divide-y divide-border">
                {quotes.map((q) => (
                  <li key={q.id} className="flex items-center justify-between px-5 py-3">
                    <Link href={`/orcamentos/${q.id}`} className="text-sm font-medium text-foreground hover:underline">
                      Orçamento #{q.numero}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted">{formatCurrency(q.valor_total)}</span>
                      <Badge tone={QUOTE_STATUS_TONE[q.status]}>{q.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Usinas instaladas" />
          <CardBody className="p-0">
            {plants.length === 0 ? (
              <EmptyState title="Nenhuma usina cadastrada" />
            ) : (
              <ul className="divide-y divide-border">
                {plants.map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-5 py-3">
                    <Link href={`/usinas/${p.id}`} className="text-sm font-medium text-foreground hover:underline">
                      {p.nome}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted">{p.potencia_kwp ? `${p.potencia_kwp} kWp` : "-"}</span>
                      <Badge tone={PLANT_STATUS_TONE[p.status]}>{p.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Histórico de interações" subtitle="Ligações, WhatsApp, e-mails, visitas e notas" />
        <CardBody>
          <form onSubmit={handleAddNote} className="mb-4 flex flex-col gap-2 sm:flex-row">
            <Select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as InteractionTipo)}
              className="sm:max-w-[160px]"
            >
              {Object.entries(INTERACTION_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Descreva o contato..."
              className="flex-1"
            />
            <Button type="submit" disabled={addingNote}>
              Adicionar
            </Button>
          </form>

          {items.length === 0 ? (
            <EmptyState title="Nenhuma interação registrada ainda" />
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 rounded-lg border border-border p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                    {initials(INTERACTION_LABEL[item.tipo])}
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{item.descricao}</p>
                    <p className="text-xs text-muted">
                      {INTERACTION_LABEL[item.tipo]} · {formatDateTime(item.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
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
