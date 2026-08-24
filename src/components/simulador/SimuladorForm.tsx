"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Client, Lead } from "@/lib/database.types";
import {
  ESTADOS_BR,
  POTENCIAS_MODULO_WP,
  simular,
} from "@/lib/simulator";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { formatCurrency } from "@/lib/utils";

type Option = { id: string; nome: string };

const TIPO_LIGACAO_FASES: Record<string, number> = {
  monofasico: 1,
  bifasico: 2,
  trifasico: 3,
};

export function SimuladorForm({
  clients,
  leads,
  defaultClientId,
  defaultLeadId,
  selectedClient,
  selectedLead,
}: {
  clients: Option[];
  leads: Option[];
  defaultClientId?: string;
  defaultLeadId?: string;
  selectedClient: Client | null;
  selectedLead: Lead | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const source = selectedClient ?? selectedLead ?? null;

  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [leadId, setLeadId] = useState(defaultLeadId ?? "");

  const [clienteNome, setClienteNome] = useState(source?.nome ?? "");
  const [clienteDocumento, setClienteDocumento] = useState(
    (selectedClient?.documento ?? selectedLead?.cpf_cnpj) ?? ""
  );
  const [clienteTelefone, setClienteTelefone] = useState(source?.telefone ?? "");
  const [clienteEmail, setClienteEmail] = useState(source?.email ?? "");
  const [clienteEndereco, setClienteEndereco] = useState(
    (selectedClient?.endereco ?? selectedLead?.endereco) ?? ""
  );
  const [clienteCidade, setClienteCidade] = useState(source?.cidade ?? "");
  const [clienteEstado, setClienteEstado] = useState(source?.estado ?? "ES");

  const [consumoKwhMes, setConsumoKwhMes] = useState(
    selectedLead?.consumo_kwh ? String(selectedLead.consumo_kwh) : ""
  );
  const [valorConta, setValorConta] = useState("");
  const [tipoLigacao, setTipoLigacao] = useState("trifasico");
  const [orientacao, setOrientacao] = useState("norte");
  const [areaDisponivel, setAreaDisponivel] = useState("");
  const [potenciaModuloWp, setPotenciaModuloWp] = useState(String(POTENCIAS_MODULO_WP[2]));
  const [marcaModulo, setMarcaModulo] = useState("");
  const [inversorMarca, setInversorMarca] = useState("");
  const [inversorModelo, setInversorModelo] = useState("");

  const [valorModuloUnit, setValorModuloUnit] = useState("");
  const [valorInversor, setValorInversor] = useState("");
  const [valorEstrutura, setValorEstrutura] = useState("");
  const [valorMaoObra, setValorMaoObra] = useState("");
  const [condicoesPagamento, setCondicoesPagamento] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultado = useMemo(
    () =>
      simular({
        consumoKwhMes: Number(consumoKwhMes) || 0,
        valorConta: Number(valorConta) || 0,
        estado: clienteEstado,
        potenciaModuloWp: Number(potenciaModuloWp),
      }),
    [consumoKwhMes, valorConta, clienteEstado, potenciaModuloWp]
  );

  const itens = useMemo(() => {
    if (!resultado) return [];
    const modulos = Number(valorModuloUnit) || 0;
    const inversor = Number(valorInversor) || 0;
    const estrutura = Number(valorEstrutura) || 0;
    const maoObra = Number(valorMaoObra) || 0;
    return [
      {
        descricao: `${resultado.quantidadeModulos}x módulo fotovoltaico ${potenciaModuloWp}Wp${marcaModulo ? ` (${marcaModulo})` : ""}`,
        quantidade: resultado.quantidadeModulos,
        valor_unitario: modulos,
        valor_total: modulos * resultado.quantidadeModulos,
      },
      {
        descricao: `Inversor ${resultado.inversorSugeridoKw}kW${inversorMarca ? ` ${inversorMarca}` : ""}${inversorModelo ? ` ${inversorModelo}` : ""}`,
        quantidade: 1,
        valor_unitario: inversor,
        valor_total: inversor,
      },
      {
        descricao: "Estrutura de fixação",
        quantidade: 1,
        valor_unitario: estrutura,
        valor_total: estrutura,
      },
      {
        descricao: "Projeto, mão de obra e instalação",
        quantidade: 1,
        valor_unitario: maoObra,
        valor_total: maoObra,
      },
    ];
  }, [resultado, valorModuloUnit, valorInversor, valorEstrutura, valorMaoObra, potenciaModuloWp, marcaModulo, inversorMarca, inversorModelo]);

  const investimentoTotal = itens.reduce((sum, it) => sum + it.valor_total, 0);
  const paybackMeses =
    resultado && resultado.economiaEstimadaMensal > 0
      ? investimentoTotal / resultado.economiaEstimadaMensal
      : null;

  async function handleGerarProposta() {
    if (!resultado) {
      setError("Preencha consumo mensal e valor da conta para calcular o sistema.");
      return;
    }
    if (!clienteNome.trim()) {
      setError("Informe o nome do cliente.");
      return;
    }
    setSaving(true);
    setError(null);

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        client_id: clientId || null,
        lead_id: leadId || null,
        potencia_kwp: resultado.potenciaRealKwp,
        quantidade_paineis: resultado.quantidadeModulos,
        valor_total: investimentoTotal,
        status: "rascunho",
        observacoes: "Gerado a partir do simulador solar.",
      })
      .select()
      .single();

    if (quoteError || !quote) {
      setError(quoteError?.message ?? "Erro ao criar orçamento.");
      setSaving(false);
      return;
    }

    const quoteItemsPayload = itens
      .filter((it) => it.valor_unitario > 0)
      .map((it, index) => ({ ...it, quote_id: quote.id, ordem: index }));
    if (quoteItemsPayload.length > 0) {
      await supabase.from("quote_items").insert(quoteItemsPayload);
    }

    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .insert({
        quote_id: quote.id,
        client_id: clientId || null,
        lead_id: leadId || null,
        cliente_nome: clienteNome,
        cliente_documento: clienteDocumento || null,
        cliente_telefone: clienteTelefone || null,
        cliente_email: clienteEmail || null,
        cliente_endereco: clienteEndereco || null,
        cliente_cidade: clienteCidade || null,
        cliente_estado: clienteEstado || null,
        consumo_kwh_mes: Number(consumoKwhMes) || null,
        potencia_kwp: resultado.potenciaRealKwp,
        quantidade_modulos: resultado.quantidadeModulos,
        potencia_modulo_wp: Number(potenciaModuloWp),
        marca_modulo: marcaModulo || null,
        inversor_marca: inversorMarca || null,
        inversor_modelo: inversorModelo || null,
        geracao_estimada_kwh_mes: resultado.geracaoEstimadaMensalKwh,
        economia_estimada_mensal: resultado.economiaEstimadaMensal,
        economia_estimada_anual: resultado.economiaEstimadaAnual,
        payback_meses: paybackMeses,
        area_ocupada_m2: resultado.areaOcupadaM2,
        itens,
        investimento_total: investimentoTotal,
        condicoes_pagamento: condicoesPagamento || null,
        status: "rascunho",
      })
      .select()
      .single();

    if (proposalError || !proposal) {
      setError(proposalError?.message ?? "Erro ao criar proposta.");
      setSaving(false);
      return;
    }

    router.push(`/propostas/${proposal.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Cliente / Lead" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Cliente cadastrado">
              <Select value={clientId} onChange={(e) => { setClientId(e.target.value); setLeadId(""); }}>
                <option value="">Nenhum</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup label="Ou lead">
              <Select value={leadId} onChange={(e) => { setLeadId(e.target.value); setClientId(""); }}>
                <option value="">Nenhum</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </Select>
            </FieldGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Nome do cliente" required>
              <Input required value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="CPF/CNPJ">
              <Input value={clienteDocumento} onChange={(e) => setClienteDocumento(e.target.value)} />
            </FieldGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Telefone">
              <Input value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Email">
              <Input value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)} />
            </FieldGroup>
          </div>
          <FieldGroup label="Endereço da instalação">
            <Input value={clienteEndereco} onChange={(e) => setClienteEndereco(e.target.value)} />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Cidade">
              <Input value={clienteCidade} onChange={(e) => setClienteCidade(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Estado (distribuidora)">
              <Select value={clienteEstado} onChange={(e) => setClienteEstado(e.target.value)}>
                {ESTADOS_BR.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </Select>
            </FieldGroup>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Consumo e instalação" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Consumo médio mensal (kWh)" required>
              <Input type="number" step="0.01" value={consumoKwhMes} onChange={(e) => setConsumoKwhMes(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Valor médio da conta (R$)" required>
              <Input type="number" step="0.01" value={valorConta} onChange={(e) => setValorConta(e.target.value)} />
            </FieldGroup>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FieldGroup label="Tipo de ligação">
              <Select value={tipoLigacao} onChange={(e) => setTipoLigacao(e.target.value)}>
                <option value="monofasico">Monofásico</option>
                <option value="bifasico">Bifásico</option>
                <option value="trifasico">Trifásico</option>
              </Select>
            </FieldGroup>
            <FieldGroup label="Nº de fases">
              <Input disabled value={TIPO_LIGACAO_FASES[tipoLigacao]} />
            </FieldGroup>
            <FieldGroup label="Orientação do telhado">
              <Select value={orientacao} onChange={(e) => setOrientacao(e.target.value)}>
                <option value="norte">Norte</option>
                <option value="leste">Leste</option>
                <option value="oeste">Oeste</option>
                <option value="sul">Sul</option>
              </Select>
            </FieldGroup>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FieldGroup label="Área disponível (m²)">
              <Input type="number" value={areaDisponivel} onChange={(e) => setAreaDisponivel(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Potência do módulo (Wp)">
              <Select value={potenciaModuloWp} onChange={(e) => setPotenciaModuloWp(e.target.value)}>
                {POTENCIAS_MODULO_WP.map((wp) => (
                  <option key={wp} value={wp}>{wp} Wp</option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup label="Marca do módulo">
              <Input value={marcaModulo} onChange={(e) => setMarcaModulo(e.target.value)} />
            </FieldGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Marca do inversor">
              <Input value={inversorMarca} onChange={(e) => setInversorMarca(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Modelo do inversor">
              <Input value={inversorModelo} onChange={(e) => setInversorModelo(e.target.value)} />
            </FieldGroup>
          </div>
        </CardBody>
      </Card>

      {resultado && (
        <Card>
          <CardHeader title="Sistema dimensionado" subtitle="Estimativa com base na irradiação média do estado" />
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Result label="Potência do sistema" value={`${resultado.potenciaRealKwp.toFixed(2)} kWp`} />
            <Result label="Módulos" value={`${resultado.quantidadeModulos}x`} />
            <Result label="Inversor sugerido" value={`${resultado.inversorSugeridoKw} kW`} />
            <Result label="Área ocupada" value={`${resultado.areaOcupadaM2.toFixed(1)} m²`} />
            <Result label="Geração estimada" value={`${resultado.geracaoEstimadaMensalKwh.toFixed(0)} kWh/mês`} />
            <Result label="Economia mensal" value={formatCurrency(resultado.economiaEstimadaMensal)} />
            <Result label="Economia anual" value={formatCurrency(resultado.economiaEstimadaAnual)} />
            <Result
              label="Payback"
              value={paybackMeses ? `${(paybackMeses / 12).toFixed(1)} anos` : "Informe os valores"}
            />
            {areaDisponivel && Number(areaDisponivel) < resultado.areaOcupadaM2 && (
              <p className="col-span-full text-sm text-danger">
                ⚠ A área disponível informada ({areaDisponivel} m²) é menor que a área ocupada estimada.
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {resultado && (
        <Card>
          <CardHeader title="Investimento" subtitle="Preencha os valores praticados pela PCA Solar" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FieldGroup label={`Valor unit. módulo (${resultado.quantidadeModulos}x)`}>
                <Input type="number" step="0.01" value={valorModuloUnit} onChange={(e) => setValorModuloUnit(e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Valor do inversor">
                <Input type="number" step="0.01" value={valorInversor} onChange={(e) => setValorInversor(e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Estrutura de fixação">
                <Input type="number" step="0.01" value={valorEstrutura} onChange={(e) => setValorEstrutura(e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Projeto e mão de obra">
                <Input type="number" step="0.01" value={valorMaoObra} onChange={(e) => setValorMaoObra(e.target.value)} />
              </FieldGroup>
            </div>
            <FieldGroup label="Condições de pagamento">
              <Input
                value={condicoesPagamento}
                onChange={(e) => setCondicoesPagamento(e.target.value)}
                placeholder="Ex.: 50% na assinatura + 50% na entrega, ou financiado em 60x"
              />
            </FieldGroup>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <p className="text-sm text-muted">Payback estimado: {paybackMeses ? `${(paybackMeses / 12).toFixed(1)} anos` : "-"}</p>
              <p className="text-base font-semibold text-foreground">
                Investimento total: <span className="text-primary">{formatCurrency(investimentoTotal)}</span>
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end">
        <Button onClick={handleGerarProposta} disabled={saving || !resultado}>
          {saving ? "Gerando..." : "Gerar proposta"}
        </Button>
      </div>
    </div>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
