"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Proposal, ProposalStatus } from "@/lib/database.types";
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_TONE } from "@/lib/propostas";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { COMPANY } from "@/lib/company";
import { formatCurrency, formatDate } from "@/lib/utils";

export function PropostaEditor({ proposal }: { proposal: Proposal }) {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<ProposalStatus>(proposal.status);
  const [editing, setEditing] = useState(false);
  const [condicoesPagamento, setCondicoesPagamento] = useState(proposal.condicoes_pagamento ?? "");
  const [garantias, setGarantias] = useState(proposal.garantias ?? "");
  const [prazoExecucaoDias, setPrazoExecucaoDias] = useState(String(proposal.prazo_execucao_dias ?? 30));
  const [observacoes, setObservacoes] = useState(proposal.observacoes ?? "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/proposta/${proposal.public_token}`
      : `/proposta/${proposal.public_token}`;

  async function handleStatusChange(newStatus: ProposalStatus) {
    setStatus(newStatus);
    await supabase.from("proposals").update({ status: newStatus }).eq("id", proposal.id);
    router.refresh();
  }

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("proposals")
      .update({
        condicoes_pagamento: condicoesPagamento || null,
        garantias: garantias || null,
        prazo_execucao_dias: Number(prazoExecucaoDias) || null,
        observacoes: observacoes || null,
      })
      .eq("id", proposal.id);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível — o link já está visível na tela
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={`Proposta #${proposal.numero}`}
          subtitle={proposal.cliente_nome}
          action={
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <Select value={status} onChange={(e) => handleStatusChange(e.target.value as ProposalStatus)}>
                {Object.entries(PROPOSAL_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
              <Button size="sm" variant="outline" onClick={handleCopyLink}>
                {copied ? "Link copiado!" : "Copiar link público"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                Imprimir / PDF
              </Button>
            </div>
          }
        />
        <CardBody className="space-y-1">
          <p className="hidden text-sm text-muted print:block">{COMPANY.legalName} · CNPJ {COMPANY.cnpj}</p>
          <p className="text-sm text-muted">
            Link público: <a href={publicUrl} className="text-primary hover:underline print:hidden">{publicUrl}</a>
          </p>
          {proposal.status === "aprovado" && proposal.approved_at && (
            <p className="text-sm text-green-700">
              ✓ Aprovada por {proposal.approved_by_name || proposal.cliente_nome} em {formatDate(proposal.approved_at)}
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Cliente e local da instalação" />
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Nome" value={proposal.cliente_nome} />
          <Info label="Documento" value={proposal.cliente_documento} />
          <Info label="Telefone" value={proposal.cliente_telefone} />
          <Info label="Email" value={proposal.cliente_email} />
          <Info label="Endereço" value={proposal.cliente_endereco} className="sm:col-span-2" />
          <Info label="Cidade/UF" value={[proposal.cliente_cidade, proposal.cliente_estado].filter(Boolean).join("/")} />
          <Info label="Consumo médio" value={proposal.consumo_kwh_mes ? `${proposal.consumo_kwh_mes} kWh/mês` : null} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Sistema proposto" />
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Potência" value={proposal.potencia_kwp ? `${Number(proposal.potencia_kwp).toFixed(2)} kWp` : null} />
          <Info label="Módulos" value={proposal.quantidade_modulos ? `${proposal.quantidade_modulos}x ${proposal.potencia_modulo_wp ?? ""}Wp` : null} />
          <Info label="Marca do módulo" value={proposal.marca_modulo} />
          <Info label="Inversor" value={[proposal.inversor_marca, proposal.inversor_modelo].filter(Boolean).join(" ") || null} />
          <Info label="Estrutura" value={proposal.estrutura_tipo} />
          <Info label="Área ocupada" value={proposal.area_ocupada_m2 ? `${Number(proposal.area_ocupada_m2).toFixed(1)} m²` : null} />
          <Info label="Geração estimada" value={proposal.geracao_estimada_kwh_mes ? `${Number(proposal.geracao_estimada_kwh_mes).toFixed(0)} kWh/mês` : null} />
          <Info label="Economia mensal" value={proposal.economia_estimada_mensal ? formatCurrency(proposal.economia_estimada_mensal) : null} />
          <Info label="Payback" value={proposal.payback_meses ? `${(proposal.payback_meses / 12).toFixed(1)} anos` : null} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Itens e investimento" />
        <CardBody>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="py-2 font-medium">Descrição</th>
                <th className="py-2 font-medium">Qtd.</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {proposal.itens.map((item, i) => (
                <tr key={i}>
                  <td className="py-2 text-foreground">{item.descricao}</td>
                  <td className="py-2 text-muted">{item.quantidade}</td>
                  <td className="py-2 text-right text-muted">{formatCurrency(item.valor_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end border-t border-border pt-3">
            <p className="text-base font-semibold text-foreground">
              Investimento total: <span className="text-primary">{formatCurrency(proposal.investimento_total)}</span>
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Condições comerciais"
          action={
            !editing ? (
              <Button size="sm" variant="outline" className="print:hidden" onClick={() => setEditing(true)}>
                Editar
              </Button>
            ) : (
              <div className="flex gap-2 print:hidden">
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
              </div>
            )
          }
        />
        <CardBody className="space-y-4">
          {!editing ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Info label="Condições de pagamento" value={proposal.condicoes_pagamento} />
              <Info label="Prazo de execução" value={proposal.prazo_execucao_dias ? `${proposal.prazo_execucao_dias} dias` : null} />
              <Info label="Garantias" value={proposal.garantias} className="sm:col-span-2" />
              <Info label="Observações" value={proposal.observacoes} className="sm:col-span-2" />
            </div>
          ) : (
            <>
              <FieldGroup label="Condições de pagamento">
                <Input value={condicoesPagamento} onChange={(e) => setCondicoesPagamento(e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Prazo de execução (dias)">
                <Input type="number" value={prazoExecucaoDias} onChange={(e) => setPrazoExecucaoDias(e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Garantias">
                <Textarea value={garantias} onChange={(e) => setGarantias(e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Observações">
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
              </FieldGroup>
            </>
          )}
        </CardBody>
      </Card>

      {status === "aprovado" && (
        <Card className="print:hidden">
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Proposta aprovada pelo cliente</p>
              <p className="text-sm text-muted">
                O módulo de Projetos (Fase 6 do roadmap) ainda não existe — quando estiver pronto, esta
                proposta poderá virar um projeto automaticamente.
              </p>
            </div>
            <Badge tone={PROPOSAL_STATUS_TONE.aprovado}>Aprovada</Badge>
          </CardBody>
        </Card>
      )}
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
