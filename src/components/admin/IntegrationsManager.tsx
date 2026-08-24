"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IntegrationConfig, IntegrationProvider } from "@/lib/database.types";
import {
  INTEGRATION_ENV_VARS,
  INTEGRATION_PROVIDER_LABEL,
  INTEGRATION_STATUS_LABEL,
  INTEGRATION_STATUS_TONE,
} from "@/lib/integracoes";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";

const PROVIDERS: IntegrationProvider[] = ["whatsapp", "instagram"];

const TEST_ENDPOINT: Record<IntegrationProvider, string> = {
  whatsapp: "/api/integracoes/whatsapp/testar",
  instagram: "/api/integracoes/instagram/testar",
};

export function IntegrationsManager({ initialConfigs }: { initialConfigs: IntegrationConfig[] }) {
  const router = useRouter();
  const [configs, setConfigs] = useState<Record<IntegrationProvider, IntegrationConfig | null>>(() => {
    const map: Record<string, IntegrationConfig | null> = {};
    PROVIDERS.forEach((p) => {
      map[p] = initialConfigs.find((c) => c.provider === p) ?? null;
    });
    return map as Record<IntegrationProvider, IntegrationConfig | null>;
  });
  const [testing, setTesting] = useState<IntegrationProvider | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  async function testar(provider: IntegrationProvider) {
    setTesting(provider);
    setErrors((prev) => ({ ...prev, [provider]: undefined }));
    try {
      const res = await fetch(TEST_ENDPOINT[provider], { method: "POST" });
      const data = await res.json();
      if (data.config) {
        setConfigs((prev) => ({ ...prev, [provider]: data.config }));
      }
      if (data.error) {
        setErrors((prev) => ({ ...prev, [provider]: data.error }));
      }
      router.refresh();
    } catch {
      setErrors((prev) => ({ ...prev, [provider]: "Falha de conexão ao testar a integração." }));
    }
    setTesting(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Integrações</h1>
        <p className="text-sm text-muted">
          Conexões oficiais com APIs da Meta. Nenhuma credencial fica salva no banco — as chaves vivem
          como variáveis de ambiente no servidor, e cada integração mostra honestamente se está
          configurada ou não.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {PROVIDERS.map((provider) => {
          const config = configs[provider];
          const status = config?.status ?? "nao_configurado";
          const metadata = config?.metadata ?? {};
          const metadataEntries = Object.entries(metadata).filter(([, v]) => v !== null && v !== undefined);

          return (
            <Card key={provider}>
              <CardHeader
                title={INTEGRATION_PROVIDER_LABEL[provider]}
                action={<Badge tone={INTEGRATION_STATUS_TONE[status]}>{INTEGRATION_STATUS_LABEL[status]}</Badge>}
              />
              <CardBody className="space-y-3">
                {status === "conectado" && metadataEntries.length > 0 && (
                  <div className="space-y-1 rounded-md bg-black/[0.02] p-3 text-sm">
                    {metadataEntries.map(([key, value]) => (
                      <p key={key} className="text-muted">
                        <span className="font-medium text-foreground">{key}:</span> {String(value)}
                      </p>
                    ))}
                  </div>
                )}

                {status === "erro" && config?.ultimo_erro && (
                  <p className="rounded-md bg-red-50 p-3 text-xs text-red-700">{config.ultimo_erro}</p>
                )}

                {status === "nao_configurado" && (
                  <p className="text-sm text-muted">
                    Ainda não configurada. Para ativar, adicione estas variáveis de ambiente no projeto na
                    Vercel:
                    <span className="mt-1 block font-mono text-xs text-foreground">
                      {INTEGRATION_ENV_VARS[provider].join(", ")}
                    </span>
                  </p>
                )}

                {errors[provider] && <p className="text-xs text-danger">{errors[provider]}</p>}

                <div className="flex items-center justify-between gap-2 pt-1">
                  {config?.ultima_verificacao ? (
                    <span className="text-xs text-muted">
                      Última verificação: {formatDateTime(config.ultima_verificacao)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">Nunca testada</span>
                  )}
                  <Button size="sm" variant="outline" onClick={() => testar(provider)} disabled={testing === provider}>
                    {testing === provider ? "Testando..." : "Testar conexão"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Card className="p-4">
        <p className="text-sm text-muted">
          <span className="font-medium text-foreground">Sobre a publicação automática: </span>
          testar a conexão confirma que o token e o número/conta estão corretos, mas enviar mensagens de
          WhatsApp ou publicar posts no Instagram por aqui ainda não está implementado — isso depende de
          revisão de app (App Review) da Meta para os escopos de publicação, que só a PCA Solar pode
          solicitar. Assim que a conexão estiver confirmada, esse é o próximo passo natural.
        </p>
      </Card>
    </div>
  );
}
