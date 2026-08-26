"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Proposal } from "@/lib/database.types";
import { COMPANY, COMPANY_ADDRESS_FULL } from "@/lib/company";
import { formatCurrency, formatDate } from "@/lib/utils";

/** Escopo padrão de serviços da PCA Solar — mesmo texto para toda proposta, edite aqui se mudar. */
const ESCOPO_SERVICOS = [
  "1 (um) ano de garantia total sobre a instalação e montagem eletromecânica.",
  "Vistoria técnica presencial no local e elaboração de projeto elétrico executivo.",
  "Homologação completa junto à distribuidora local: solicitação de parecer de acesso e vistoria final.",
  "Emissão de ART (Anotação de Responsabilidade Técnica) registrada no CREA.",
  "Montagem e conexões completas: fixação estrutural, cabeamento solar e comissionamento.",
  "Treinamento e suporte: instruções de monitoramento via aplicativo de celular.",
];

export function PropostaPublica({ proposal: initial }: { proposal: Proposal }) {
  const supabase = createClient();
  const [proposal, setProposal] = useState(initial);
  const [clientName, setClientName] = useState("");
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    if (!clientName.trim()) {
      setError("Digite seu nome completo para confirmar a aprovação.");
      return;
    }
    setApproving(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("approve_proposal", {
      _token: proposal.public_token,
      _client_name: clientName,
    });
    if (rpcError || !data) {
      setError("Não foi possível registrar a aprovação. Tente novamente.");
    } else {
      setProposal(data);
    }
    setApproving(false);
  }

  const pending = proposal.status === "rascunho" || proposal.status === "enviado";
  const potenciaModulosWp =
    proposal.quantidade_modulos && proposal.potencia_modulo_wp
      ? (proposal.quantidade_modulos * proposal.potencia_modulo_wp) / 1000
      : null;

  return (
    <div className="min-h-screen bg-background py-6 print:bg-white print:py-0">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 print:max-w-none print:px-0">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <div className="relative h-11 w-11 rounded-xl bg-white p-1.5 shadow-sm">
            <Image src="/logo-pca.png" alt={COMPANY.name} fill sizes="44px" className="object-contain p-0.5" />
          </div>
          <button
            onClick={() => window.print()}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-black/5"
          >
            Baixar / Imprimir PDF
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm print:rounded-none print:border-0 print:shadow-none">
          {/* ===== Cabeçalho ===== */}
          <div className="flex flex-col gap-4 bg-accent px-6 py-6 text-accent-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 rounded-xl bg-white p-2">
                <Image src="/logo-pca.png" alt={COMPANY.name} fill sizes="56px" className="object-contain" />
              </div>
              <div>
                <p className="font-tabular text-lg font-bold leading-tight">{COMPANY.name}</p>
                <p className="text-xs leading-snug text-accent-foreground/70">{COMPANY.legalName}</p>
                <p className="text-xs leading-snug text-accent-foreground/70">
                  {COMPANY.address} · {COMPANY.phone}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                Proposta comercial
              </span>
              <p className="mt-2 text-sm">
                Ref.: Sistema On-Grid {proposal.potencia_kwp ? `${Number(proposal.potencia_kwp).toFixed(2)} kWp` : ""}
              </p>
              <p className="text-xs text-accent-foreground/70">Nº {proposal.numero} · {formatDate(proposal.created_at)}</p>
            </div>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-10">
            {/* ===== Dados do cliente ===== */}
            <Section title="Dados cadastrais do cliente e local de instalação">
              <Grid>
                <Item label="Nome / Razão social" value={proposal.cliente_nome} />
                <Item label="CPF / CNPJ" value={proposal.cliente_documento} />
                <Item label="Telefone / WhatsApp" value={proposal.cliente_telefone} />
                <Item label="E-mail" value={proposal.cliente_email} />
                <Item label="Endereço da instalação" value={proposal.cliente_endereco} />
                <Item
                  label="Cidade / UF"
                  value={[proposal.cliente_cidade, proposal.cliente_estado].filter(Boolean).join(" - ")}
                />
                <Item label="Estrutura de fixação" value={proposal.estrutura_tipo} />
                <Item
                  label="Consumo médio mensal"
                  value={proposal.consumo_kwh_mes ? `${proposal.consumo_kwh_mes} kWh/mês` : null}
                />
              </Grid>
            </Section>

            {/* ===== Destaques do sistema ===== */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Highlight
                label="Potência geradora"
                value={proposal.potencia_kwp ? `${Number(proposal.potencia_kwp).toFixed(2)} kWp` : "-"}
              />
              <Highlight
                label="Geração média mensal"
                value={
                  proposal.geracao_estimada_kwh_mes
                    ? `${Number(proposal.geracao_estimada_kwh_mes).toFixed(0)} kWh`
                    : "-"
                }
              />
              <Highlight
                label="Área mínima de telhado"
                value={proposal.area_ocupada_m2 ? `${Number(proposal.area_ocupada_m2).toFixed(0)} m²` : "-"}
              />
              <Highlight
                label="Payback estimado"
                value={proposal.payback_meses ? `${Math.round(proposal.payback_meses)} meses` : "-"}
                tone="primary"
              />
            </div>

            {/* ===== Equipamentos ===== */}
            <Section title="Especificação técnica dos equipamentos">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-accent/5 text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">Qtd.</th>
                      <th className="px-3 py-2 font-medium">Item</th>
                      <th className="px-3 py-2 font-medium">Descrição</th>
                      <th className="px-3 py-2 text-right font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {proposal.quantidade_modulos && (
                      <tr>
                        <td className="px-3 py-2 text-foreground">{proposal.quantidade_modulos}</td>
                        <td className="px-3 py-2 font-medium text-foreground">Módulos fotovoltaicos</td>
                        <td className="px-3 py-2 text-muted">
                          {proposal.marca_modulo || "Módulo monocristalino de alta eficiência"}
                          {proposal.potencia_modulo_wp ? ` — ${proposal.potencia_modulo_wp}Wp` : ""}
                          {potenciaModulosWp ? ` (${potenciaModulosWp.toFixed(2)} kWp total)` : ""}
                        </td>
                        <td className="px-3 py-2 text-right text-muted">
                          {formatCurrency(
                            proposal.itens.find((i) => /m[óo]dulo/i.test(i.descricao))?.valor_total ?? 0
                          )}
                        </td>
                      </tr>
                    )}
                    {(proposal.inversor_marca || proposal.inversor_modelo) && (
                      <tr>
                        <td className="px-3 py-2 text-foreground">1</td>
                        <td className="px-3 py-2 font-medium text-foreground">Inversor</td>
                        <td className="px-3 py-2 text-muted">
                          {[proposal.inversor_marca, proposal.inversor_modelo].filter(Boolean).join(" ")}
                        </td>
                        <td className="px-3 py-2 text-right text-muted">
                          {formatCurrency(
                            proposal.itens.find((i) => /invers/i.test(i.descricao))?.valor_total ?? 0
                          )}
                        </td>
                      </tr>
                    )}
                    {proposal.itens
                      .filter((i) => !/m[óo]dulo|invers/i.test(i.descricao))
                      .map((item, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-foreground">{item.quantidade}</td>
                          <td className="px-3 py-2 font-medium text-foreground" colSpan={2}>
                            {item.descricao}
                          </td>
                          <td className="px-3 py-2 text-right text-muted">{formatCurrency(item.valor_total)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-end">
                <p className="font-tabular text-lg font-bold text-foreground">
                  Total: <span className="text-primary">{formatCurrency(proposal.investimento_total)}</span>
                </p>
              </div>
            </Section>

            {/* ===== Análise financeira ===== */}
            <Section title="Análise econômico-financeira e investimento">
              <div className="rounded-xl border border-success/30 bg-success/10 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/70">Economia mensal estimada</p>
                    <p className="font-tabular text-xl font-bold text-foreground">
                      {proposal.economia_estimada_mensal ? formatCurrency(proposal.economia_estimada_mensal) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/70">Economia anual estimada</p>
                    <p className="font-tabular text-2xl font-bold text-success">
                      {proposal.economia_estimada_anual ? formatCurrency(proposal.economia_estimada_anual) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/70">Valor do sistema (chave na mão)</p>
                    <p className="font-tabular text-xl font-bold text-foreground">
                      {formatCurrency(proposal.investimento_total)}
                    </p>
                  </div>
                </div>
                {proposal.condicoes_pagamento && (
                  <p className="mt-4 border-t border-success/20 pt-3 text-sm text-foreground/80">
                    <span className="font-medium text-foreground">Condições de pagamento: </span>
                    {proposal.condicoes_pagamento}
                  </p>
                )}
              </div>
            </Section>

            {/* ===== Escopo de serviços ===== */}
            <Section title="Escopo dos serviços inclusos e engenharia">
              <ul className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-foreground sm:grid-cols-2">
                {ESCOPO_SERVICOS.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-0.5 text-success">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {proposal.garantias && (
                <p className="mt-4 text-sm text-muted">
                  <span className="font-medium text-foreground">Garantias: </span>
                  {proposal.garantias}
                </p>
              )}
              {proposal.observacoes && (
                <p className="mt-2 text-sm text-muted">
                  <span className="font-medium text-foreground">Observações: </span>
                  {proposal.observacoes}
                </p>
              )}
              <p className="mt-4 rounded-lg bg-accent/5 p-3 text-xs text-muted">
                Não estão inclusos eventuais serviços de alvenaria civil pesada, reforço estrutural de telhado ou
                adequações de padrão de entrada de energia solicitadas extraordinariamente pela concessionária local.
              </p>
            </Section>

            {/* ===== Assinatura ===== */}
            <div className="grid grid-cols-1 gap-8 border-t border-border pt-8 text-center text-sm sm:grid-cols-2">
              <div>
                <div className="mb-1 border-t border-foreground/40 pt-2">{proposal.cliente_nome}</div>
                <p className="text-xs text-muted">Contratante / Cliente</p>
              </div>
              <div>
                <div className="mb-1 border-t border-foreground/40 pt-2">{COMPANY.legalName}</div>
                <p className="text-xs text-muted">{COMPANY.name} - Contratada</p>
              </div>
            </div>

            {/* ===== Aprovação / status ===== */}
            <div className="border-t border-border pt-6 print:hidden">
              {proposal.status === "aprovado" ? (
                <div className="rounded-lg bg-success/10 px-4 py-3 text-sm font-medium text-success">
                  ✓ Proposta aprovada por {proposal.approved_by_name} em{" "}
                  {proposal.approved_at ? formatDate(proposal.approved_at) : ""}.
                </div>
              ) : proposal.status === "recusado" ? (
                <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                  Esta proposta foi marcada como recusada.
                </div>
              ) : pending ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Para aprovar esta proposta, digite seu nome completo abaixo.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      onClick={handleApprove}
                      disabled={approving}
                      className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {approving ? "Enviando..." : "Aprovar proposta"}
                    </button>
                  </div>
                  {error && <p className="text-sm text-danger">{error}</p>}
                </div>
              ) : null}
            </div>

            <p className="pt-2 text-center text-xs text-muted">
              {COMPANY_ADDRESS_FULL} · {COMPANY.phone} · {COMPANY.email} · CNPJ {COMPANY.cnpj}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent">
        <span className="h-4 w-1 rounded-full bg-primary" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm text-foreground">{value || "-"}</p>
    </div>
  );
}

function Highlight({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "primary";
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 text-center">
      <p className="font-tabular text-lg font-bold text-foreground sm:text-xl">
        <span className={tone === "primary" ? "text-primary" : undefined}>{value}</span>
      </p>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}
