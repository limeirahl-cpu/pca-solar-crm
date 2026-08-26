"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { formatCurrency } from "@/lib/utils";
import { FortlevKitSearch, resumoComponentes, type FortlevKit } from "@/components/fornecedores/FortlevKitSearch";

type Option = { id: string; nome: string };

type ItemForm = {
  descricao: string;
  quantidade: string;
  valor_unitario: string;
};

const emptyItem: ItemForm = { descricao: "", quantidade: "1", valor_unitario: "" };

export function NewQuoteForm({
  clients,
  leads,
  defaultClientId,
  defaultLeadId,
}: {
  clients: Option[];
  leads: Option[];
  defaultClientId?: string;
  defaultLeadId?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [leadId, setLeadId] = useState(defaultLeadId ?? "");
  const [potenciaKwp, setPotenciaKwp] = useState("");
  const [qtdPaineis, setQtdPaineis] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [validadeDias, setValidadeDias] = useState("15");
  const [observacoes, setObservacoes] = useState("");
  const [items, setItems] = useState<ItemForm[]>([
    { descricao: "Kit fotovoltaico (painéis + inversor)", quantidade: "1", valor_unitario: "" },
    { descricao: "Mão de obra e instalação", quantidade: "1", valor_unitario: "" },
  ]);
  const [cidadeCotacao, setCidadeCotacao] = useState("");
  const [fasesCotacao, setFasesCotacao] = useState("3");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelecionarKitFortlev(kit: FortlevKit) {
    setPotenciaKwp(String(kit.power));
    setItems((prev) => {
      const resto = prev.slice(1);
      return [
        {
          descricao: `Kit fotovoltaico ${kit.power.toFixed(2)} kWp — ${resumoComponentes(kit)} (Fortlev Solar)`,
          quantidade: "1",
          valor_unitario: String(kit.final_price),
        },
        ...resto,
      ];
    });
  }

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const qty = Number(item.quantidade) || 0;
        const unit = Number(item.valor_unitario) || 0;
        return sum + qty * unit;
      }, 0),
    [items]
  );

  function updateItem(index: number, patch: Partial<ItemForm>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId && !leadId) {
      setError("Selecione um cliente ou um lead.");
      return;
    }
    setSaving(true);
    setError(null);

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        client_id: clientId || null,
        lead_id: leadId || null,
        potencia_kwp: potenciaKwp ? Number(potenciaKwp) : null,
        quantidade_paineis: qtdPaineis ? Number(qtdPaineis) : null,
        forma_pagamento: formaPagamento || null,
        validade_dias: Number(validadeDias) || 15,
        observacoes: observacoes || null,
        valor_total: total,
        status: "rascunho",
      })
      .select()
      .single();

    if (quoteError || !quote) {
      setError(quoteError?.message ?? "Erro ao criar orçamento.");
      setSaving(false);
      return;
    }

    const itemsPayload = items
      .filter((it) => it.descricao.trim())
      .map((it, index) => ({
        quote_id: quote.id,
        descricao: it.descricao,
        quantidade: Number(it.quantidade) || 1,
        valor_unitario: Number(it.valor_unitario) || 0,
        valor_total: (Number(it.quantidade) || 1) * (Number(it.valor_unitario) || 0),
        ordem: index,
      }));

    if (itemsPayload.length > 0) {
      await supabase.from("quote_items").insert(itemsPayload);
    }

    router.push(`/orcamentos/${quote.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader title="Dados gerais" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Cliente">
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Selecione...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup label="Ou lead (ainda não convertido)">
              <Select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
                <option value="">Selecione...</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FieldGroup label="Potência (kWp)">
              <Input
                type="number"
                step="0.01"
                value={potenciaKwp}
                onChange={(e) => setPotenciaKwp(e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Qtd. de painéis">
              <Input type="number" value={qtdPaineis} onChange={(e) => setQtdPaineis(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Validade (dias)">
              <Input type="number" value={validadeDias} onChange={(e) => setValidadeDias(e.target.value)} />
            </FieldGroup>
          </div>

          <FieldGroup label="Forma de pagamento">
            <Input
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              placeholder="Ex: à vista, financiado em 60x, cartão..."
            />
          </FieldGroup>

          <FieldGroup label="Observações">
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </FieldGroup>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Cotação com fornecedor"
          subtitle="Opcional — busca preço e equipamento reais para preencher o primeiro item automaticamente."
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Cidade da instalação">
              <Input value={cidadeCotacao} onChange={(e) => setCidadeCotacao(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Nº de fases">
              <Select value={fasesCotacao} onChange={(e) => setFasesCotacao(e.target.value)}>
                <option value="1">Monofásico</option>
                <option value="2">Bifásico</option>
                <option value="3">Trifásico</option>
              </Select>
            </FieldGroup>
          </div>
          <FortlevKitSearch
            potenciaKwp={Number(potenciaKwp) || 0}
            cidade={cidadeCotacao}
            fases={Number(fasesCotacao)}
            onSelectKit={handleSelecionarKitFortlev}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Itens do orçamento" />
        <CardBody className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-6">
                <FieldGroup label={index === 0 ? "Descrição" : undefined}>
                  <Input
                    value={item.descricao}
                    onChange={(e) => updateItem(index, { descricao: e.target.value })}
                    placeholder="Descrição do item"
                  />
                </FieldGroup>
              </div>
              <div className="col-span-2">
                <FieldGroup label={index === 0 ? "Qtd." : undefined}>
                  <Input
                    type="number"
                    value={item.quantidade}
                    onChange={(e) => updateItem(index, { quantidade: e.target.value })}
                  />
                </FieldGroup>
              </div>
              <div className="col-span-3">
                <FieldGroup label={index === 0 ? "Valor unitário (R$)" : undefined}>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.valor_unitario}
                    onChange={(e) => updateItem(index, { valor_unitario: e.target.value })}
                  />
                </FieldGroup>
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

          <div className="flex justify-end border-t border-border pt-3">
            <p className="text-base font-semibold text-foreground">
              Total: <span className="text-primary">{formatCurrency(total)}</span>
            </p>
          </div>
        </CardBody>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Criar orçamento"}
        </Button>
      </div>
    </form>
  );
}
