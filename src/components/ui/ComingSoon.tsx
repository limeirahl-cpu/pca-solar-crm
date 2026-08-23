import { Card, CardBody } from "@/components/ui/Card";

export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description?: string;
  /** Referência à fase do roadmap em que este módulo será implementado. */
  phase?: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>

      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
            🚧
          </span>
          <p className="text-base font-semibold text-foreground">Módulo em construção</p>
          <p className="max-w-md text-sm text-muted">
            Esta área ainda não está conectada ao banco de dados — ela faz parte do roadmap de
            evolução do sistema{phase ? ` (${phase})` : ""} e será implementada em uma próxima
            etapa, sem interromper o que já está em uso hoje.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
