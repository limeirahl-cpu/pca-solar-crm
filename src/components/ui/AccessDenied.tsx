import { Card, CardBody } from "@/components/ui/Card";

export function AccessDenied() {
  return (
    <Card>
      <CardBody className="flex flex-col items-center gap-2 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-danger/10 text-2xl">
          🔒
        </span>
        <p className="text-base font-semibold text-foreground">Acesso restrito</p>
        <p className="max-w-sm text-sm text-muted">
          Esta área é exclusiva para administradores. Fale com um administrador do sistema se você
          acredita que deveria ter acesso.
        </p>
      </CardBody>
    </Card>
  );
}
