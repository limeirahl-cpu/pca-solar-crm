"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Proposal } from "@/lib/database.types";
import { COMPANY, COMPANY_ADDRESS_FULL } from "@/lib/company";
import { formatCurrency, formatDate } from "@/lib/utils";

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

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.006_80)]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <div className="mb-8 flex items-center justify-between print:hidden">
          <div className="relative h-12 w-12">
            <Image src="/logo-pca.png" alt={COMPANY.name} fill sizes="48px" className="object-contain" />
          </div>
          <button
            onClick={() => window.print()}
            className="rounded-md border border-[oklch(0.91_0.012_70)] bg-white px-3 py-1.5 text-sm font-medium text-[oklch(0.26_0.035_255)] hover:bg-black/5"
          >
            Baixar / Imprimir PDF
          </button>
        </div>

        <div className="rounded-2xl border border-[oklch(0.91_0.012_70)] bg-white p-6 shadow-sm sm:p-10">
          <div className="border-b border-[oklch(0.91_0.012_70)] pb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[oklch(0.7_0.19_47)]">
              Proposta comercial nº {proposal.numero}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[oklch(0.26_0.035_255)]">
              Sistema fotovoltaico para {proposal.cliente_nome}
            </h1>
            <p className="mt-1 text-sm text-[oklch(0.52_0.026_255)]">
              {COMPANY.legalName} · CNPJ {COMPANY.cnpj} · {COMPANY_ADDRESS_FULL}
            </p>
          </div>

          <Section title="Dados do cliente">
            <Grid>
              <Item label="Nome" value={proposal.cliente_nome} />
              <Item label="Documento" value={proposal.cliente_documento} />
              <Item label="Endereço" value={proposal.cliente_endereco} />
              <Item
                label="Cidade/UF"
                value={[proposal.cliente_cidade, proposal.cliente_estado].filter(Boolean).join("/")}
              />
              <Item
                label="Consumo médio"
                value={proposal.consumo_kwh_mes ? `${proposal.consumo_kwh_mes} kWh/mês` : null}
              />
            </Grid>
          </Section>

          <Section title="Sistema proposto">
            <Grid>
              <Item
                label="Potência"
                value={proposal.potencia_kwp ? `${Number(proposal.potencia_kwp).toFixed(2)} kWp` : null}
              />
              <Item
                label="Módulos"
                value={
                  proposal.quantidade_modulos
                    ? `${proposal.quantidade_modulos}x ${proposal.potencia_modulo_wp ?? ""}Wp${proposal.marca_modulo ? ` (${proposal.marca_modulo})` : ""}`
                    : null
                }
              />
              <Item
                label="Inversor"
                value={[proposal.inversor_marca, proposal.inversor_modelo].filter(Boolean).join(" ") || null}
              />
              <Item label="Estrutura" value={proposal.estrutura_tipo} />
              <Item
                label="Geração estimada"
                value={
                  proposal.geracao_estimada_kwh_mes
                    ? `${Number(proposal.geracao_estimada_kwh_mes).toFixed(0)} kWh/mês`
                    : null
                }
              />
              <Item
                label="Economia estimada"
                value={
                  proposal.economia_estimada_mensal
                    ? `${formatCurrency(proposal.economia_estimada_mensal)}/mês`
                    : null
                }
              />
              <Item
                label="Payback estimado"
                value={proposal.payback_meses ? `${(proposal.payback_meses / 12).toFixed(1)} anos` : null}
              />
            </Grid>
          </Section>

          <Section title="Investimento">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[oklch(0.91_0.012_70)] text-xs uppercase text-[oklch(0.52_0.026_255)]">
                <tr>
                  <th className="py-2 font-medium">Item</th>
                  <th className="py-2 font-medium">Qtd.</th>
                  <th className="py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[oklch(0.91_0.012_70)]">
                {proposal.itens.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 text-[oklch(0.26_0.035_255)]">{item.descricao}</td>
                    <td className="py-2 text-[oklch(0.52_0.026_255)]">{item.quantidade}</td>
                    <td className="py-2 text-right text-[oklch(0.52_0.026_255)]">
                      {formatCurrency(item.valor_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-end border-t border-[oklch(0.91_0.012_70)] pt-3">
              <p className="text-lg font-bold text-[oklch(0.26_0.035_255)]">
                Total: {formatCurrency(proposal.investimento_total)}
              </p>
            </div>
          </Section>

          <Section title="Condições comerciais">
            <Grid>
              <Item label="Forma de pagamento" value={proposal.condicoes_pagamento} />
              <Item
                label="Prazo de execução"
                value={proposal.prazo_execucao_dias ? `${proposal.prazo_execucao_dias} dias` : null}
              />
            </Grid>
            {proposal.garantias && (
              <p className="mt-3 text-sm text-[oklch(0.52_0.026_255)]">
                <span className="font-medium text-[oklch(0.26_0.035_255)]">Garantias: </span>
                {proposal.garantias}
              </p>
            )}
            {proposal.observacoes && (
              <p className="mt-2 text-sm text-[oklch(0.52_0.026_255)]">
                <span className="font-medium text-[oklch(0.26_0.035_255)]">Observações: </span>
                {proposal.observacoes}
              </p>
            )}
          </Section>

          <div className="mt-8 border-t border-[oklch(0.91_0.012_70)] pt-6 print:hidden">
            {proposal.status === "aprovado" ? (
              <div className="rounded-lg bg-[oklch(0.62_0.15_150/0.12)] px-4 py-3 text-sm font-medium text-[oklch(0.4_0.13_150)]">
                ✓ Proposta aprovada por {proposal.approved_by_name} em{" "}
                {proposal.approved_at ? formatDate(proposal.approved_at) : ""}.
              </div>
            ) : proposal.status === "recusado" ? (
              <div className="rounded-lg bg-[oklch(0.58_0.22_27/0.12)] px-4 py-3 text-sm font-medium text-[oklch(0.5_0.2_27)]">
                Esta proposta foi marcada como recusada.
              </div>
            ) : pending ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[oklch(0.26_0.035_255)]">
                  Para aprovar esta proposta, digite seu nome completo abaixo.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="flex-1 rounded-md border border-[oklch(0.91_0.012_70)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.7_0.19_47/0.4)]"
                  />
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="rounded-md bg-[oklch(0.7_0.19_47)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {approving ? "Enviando..." : "Aprovar proposta"}
                  </button>
                </div>
                {error && <p className="text-sm text-[oklch(0.58_0.22_27)]">{error}</p>}
              </div>
            ) : null}
          </div>

          <p className="mt-8 text-center text-xs text-[oklch(0.52_0.026_255)]">
            {COMPANY.phone} · {COMPANY.email}
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[oklch(0.91_0.012_70)] py-6 last:border-b-0">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[oklch(0.52_0.026_255)]">
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
      <p className="text-xs uppercase tracking-wide text-[oklch(0.52_0.026_255)]">{label}</p>
      <p className="text-sm text-[oklch(0.26_0.035_255)]">{value || "-"}</p>
    </div>
  );
}
