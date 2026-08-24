"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupplierComponent } from "@/lib/database.types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { formatDateTime } from "@/lib/utils";

export type CatalogItemWithSupplier = SupplierComponent & { suppliers: { nome: string } | null };
type Option = { id: string; nome: string };

export function CatalogoFornecedoresManager({
  initialItens,
  suppliers,
}: {
  initialItens: CatalogItemWithSupplier[];
  suppliers: Option[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [fornecedorFiltro, setFornecedorFiltro] = useState("");

  const filtrados = useMemo(
    () =>
      initialItens.filter((item) => {
        const termo = search.trim().toLowerCase();
        const bateBusca =
          !termo ||
          item.nome.toLowerCase().includes(termo) ||
          item.codigo?.toLowerCase().includes(termo) ||
          item.familia?.toLowerCase().includes(termo);
        const bateFornecedor = !fornecedorFiltro || item.supplier_id === fornecedorFiltro;
        return bateBusca && bateFornecedor;
      }),
    [initialItens, search, fornecedorFiltro]
  );

  // Agrupa por nome normalizado — quando houver mais de um fornecedor com o
  // mesmo item, isso é o que habilita a comparação lado a lado no futuro.
  const gruposComMultiplosFornecedores = useMemo(() => {
    const porNome = new Map<string, Set<string>>();
    for (const item of initialItens) {
      const chave = item.nome.trim().toLowerCase();
      if (!porNome.has(chave)) porNome.set(chave, new Set());
      porNome.get(chave)!.add(item.supplier_id);
    }
    return [...porNome.values()].filter((fornecedores) => fornecedores.size > 1).length;
  }, [initialItens]);

  const ultimaSincronizacao = initialItens[0]?.sincronizado_em;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Catálogo de Fornecedores</h1>
          <p className="text-sm text-muted">
            Itens sincronizados automaticamente das integrações oficiais (Admin → Integrações).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.refresh()}>
          Atualizar lista
        </Button>
      </div>

      {initialItens.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="Nenhum item sincronizado ainda"
              description="Vá em Admin → Integrações, conecte um fornecedor (por exemplo, Fortlev Solar) e clique em “Sincronizar catálogo”. Os itens aparecem aqui automaticamente."
            />
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              placeholder="Buscar por nome, código ou família..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:col-span-2"
            />
            <Select value={fornecedorFiltro} onChange={(e) => setFornecedorFiltro(e.target.value)}>
              <option value="">Todos os fornecedores</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </Select>
          </div>

          {gruposComMultiplosFornecedores > 0 ? (
            <p className="text-xs text-muted">
              {gruposComMultiplosFornecedores} item(ns) disponível(is) em mais de um fornecedor — use a
              busca para comparar.
            </p>
          ) : (
            <p className="text-xs text-muted">
              Só há um fornecedor conectado até agora. Assim que outro fornecedor for cadastrado com
              integração ou planilha, itens equivalentes vão poder ser comparados lado a lado aqui.
            </p>
          )}

          <Card>
            <CardHeader
              title={`${filtrados.length} de ${initialItens.length} itens`}
              subtitle={
                ultimaSincronizacao
                  ? `Última sincronização: ${formatDateTime(ultimaSincronizacao)}`
                  : undefined
              }
            />
            <CardBody className="p-0">
              <ul className="divide-y divide-border">
                {filtrados.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.nome}</p>
                      <p className="truncate text-xs text-muted">
                        {item.codigo ? `Código ${item.codigo}` : "Sem código"}
                        {item.familia ? ` · ${item.familia}` : ""}
                      </p>
                    </div>
                    <Badge tone="blue">{item.suppliers?.nome ?? "Fornecedor"}</Badge>
                  </li>
                ))}
              </ul>
              {filtrados.length === 0 && (
                <EmptyState title="Nenhum item encontrado" description="Tente outro termo de busca." />
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
