"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Plant, PlantStatus } from "@/lib/database.types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { formatDate } from "@/lib/utils";

type PlantWithClient = Plant & { clients: { nome: string } | null };
type Option = { id: string; nome: string };

const STATUS_OPTIONS: { value: PlantStatus; label: string; tone: "green" | "amber" | "red" }[] = [
  { value: "ativa", label: "Ativa", tone: "green" },
  { value: "manutencao", label: "Em manutenção", tone: "amber" },
  { value: "inativa", label: "Inativa", tone: "red" },
];

const emptyForm = {
  client_id: "",
  nome: "",
  endereco: "",
  cidade: "",
  estado: "",
  potencia_kwp: "",
  quantidade_paineis: "",
  marca_inversor: "",
  modelo_inversor: "",
  data_instalacao: "",
  status: "ativa" as PlantStatus,
  geracao_mensal_media_kwh: "",
  observacoes: "",
};

export function PlantsManager({
  initialPlants,
  clients,
  openCreate,
  defaultClientId,
}: {
  initialPlants: PlantWithClient[];
  clients: Option[];
  openCreate?: boolean;
  defaultClientId?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [plants, setPlants] = useState<PlantWithClient[]>(initialPlants);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(Boolean(openCreate));
  const [form, setForm] = useState({ ...emptyForm, client_id: defaultClientId ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return plants.filter(
      (p) =>
        !search ||
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        (p.clients?.nome ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [plants, search]);

  function openNew() {
    setForm({ ...emptyForm, client_id: defaultClientId ?? "" });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_id) {
      setError("Selecione o cliente dono da usina.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      client_id: form.client_id,
      nome: form.nome,
      endereco: form.endereco || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      potencia_kwp: form.potencia_kwp ? Number(form.potencia_kwp) : null,
      quantidade_paineis: form.quantidade_paineis ? Number(form.quantidade_paineis) : null,
      marca_inversor: form.marca_inversor || null,
      modelo_inversor: form.modelo_inversor || null,
      data_instalacao: form.data_instalacao || null,
      status: form.status,
      geracao_mensal_media_kwh: form.geracao_mensal_media_kwh
        ? Number(form.geracao_mensal_media_kwh)
        : null,
      observacoes: form.observacoes || null,
    };

    const { data, error } = await supabase
      .from("plants")
      .insert(payload)
      .select("*, clients(nome)")
      .single();

    if (error) {
      setError(error.message);
    } else if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPlants((prev) => [data as any as PlantWithClient, ...prev]);
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
            placeholder="Buscar por usina ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-sm"
          />
          <Button onClick={openNew}>+ Nova usina</Button>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhuma usina cadastrada"
            description="Cadastre as usinas já instaladas para começar o monitoramento."
            action={<Button onClick={openNew}>+ Nova usina</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Usina</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Potência</th>
                  <th className="px-5 py-3 font-medium">Instalação</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((plant) => {
                  const statusMeta = STATUS_OPTIONS.find((s) => s.value === plant.status);
                  return (
                    <tr key={plant.id} className="hover:bg-black/[0.02]">
                      <td className="px-5 py-3 font-medium text-foreground">{plant.nome}</td>
                      <td className="px-5 py-3 text-muted">{plant.clients?.nome ?? "-"}</td>
                      <td className="px-5 py-3 text-muted">
                        {plant.potencia_kwp ? `${plant.potencia_kwp} kWp` : "-"}
                      </td>
                      <td className="px-5 py-3 text-muted">{formatDate(plant.data_instalacao)}</td>
                      <td className="px-5 py-3">
                        <Badge tone={statusMeta?.tone}>{statusMeta?.label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/usinas/${plant.id}`}>
                          <Button size="sm" variant="outline">
                            Ver detalhes
                          </Button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova usina">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup label="Cliente" required>
            <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </FieldGroup>

          <FieldGroup label="Nome/identificação da usina" required>
            <Input
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Usina - Residência João"
            />
          </FieldGroup>

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

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Potência (kWp)">
              <Input
                type="number"
                step="0.01"
                value={form.potencia_kwp}
                onChange={(e) => setForm({ ...form, potencia_kwp: e.target.value })}
              />
            </FieldGroup>
            <FieldGroup label="Qtd. de painéis">
              <Input
                type="number"
                value={form.quantidade_paineis}
                onChange={(e) => setForm({ ...form, quantidade_paineis: e.target.value })}
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Marca do inversor">
              <Input
                value={form.marca_inversor}
                onChange={(e) => setForm({ ...form, marca_inversor: e.target.value })}
                placeholder="Growatt, Fronius, Deye..."
              />
            </FieldGroup>
            <FieldGroup label="Modelo do inversor">
              <Input
                value={form.modelo_inversor}
                onChange={(e) => setForm({ ...form, modelo_inversor: e.target.value })}
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Data de instalação">
              <Input
                type="date"
                value={form.data_instalacao}
                onChange={(e) => setForm({ ...form, data_instalacao: e.target.value })}
              />
            </FieldGroup>
            <FieldGroup label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PlantStatus })}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          </div>

          <FieldGroup label="Geração mensal média (kWh)">
            <Input
              type="number"
              step="0.01"
              value={form.geracao_mensal_media_kwh}
              onChange={(e) => setForm({ ...form, geracao_mensal_media_kwh: e.target.value })}
            />
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
